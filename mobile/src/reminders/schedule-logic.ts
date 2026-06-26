import type { Task } from '@/api/types';
import type { ReminderSettings } from './settings';

// iOS caps locally scheduled notifications at 64; stay comfortably under it.
export const MAX_SCHEDULED = 60;

export interface PendingReminder {
  date: Date;
  taskId: string;
  title: string;
  dueDate: string;
}

/** Per-task override of the global reminder settings. */
export interface TaskReminderOverride {
  /** Silence reminders for this task regardless of global settings. */
  muted?: boolean;
  /** Custom lead-time offsets for this task (replaces the global ones). */
  leadDays?: number[];
}

export type TaskReminderOverrides = Record<string, TaskReminderOverride>;

/** Local trigger date for a task at a given lead time (days before due). */
export function triggerDateFor(
  dueIso: string,
  leadDays: number,
  hour: number,
  minute: number,
): Date | null {
  const due = new Date(`${dueIso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  due.setDate(due.getDate() - leadDays);
  due.setHours(hour, minute, 0, 0);
  return due;
}

/**
 * Stable signature of the reminder-relevant state, used to skip rescheduling
 * when nothing changed (React Query returns a fresh array on every refetch).
 */
export function scheduleSignature(
  tasks: Task[],
  settings: ReminderSettings,
  overrides: TaskReminderOverrides = {},
): string {
  const head = `${settings.enabled}|${settings.hour}:${settings.minute}|${[
    ...settings.leadDays,
  ]
    .sort((a, b) => a - b)
    .join(',')}`;
  const body = tasks
    .filter((task) => task.status === 'active' && task.due_date)
    .map((task) => {
      const o = overrides[task.id];
      const over = o ? `${o.muted ? 'm' : ''}${(o.leadDays ?? []).join(',')}` : '';
      return `${task.id}:${task.due_date}:${task.title}:${over}`;
    })
    .sort()
    .join('|');
  return `${head}#${body}`;
}

/**
 * The reminders to schedule, soonest first and capped — pure so it can be unit
 * tested without the native notifications module.
 */
export function buildPendingReminders(
  tasks: Task[],
  settings: ReminderSettings,
  now: number,
  overrides: TaskReminderOverrides = {},
): PendingReminder[] {
  if (!settings.enabled) return [];

  const pending: PendingReminder[] = [];
  for (const task of tasks) {
    if (task.status !== 'active' || !task.due_date) continue;

    const override = overrides[task.id];
    if (override?.muted) continue;
    // A per-task lead-time list replaces the global one when present.
    const leadDays = override?.leadDays ?? settings.leadDays;

    for (const lead of leadDays) {
      const date = triggerDateFor(
        task.due_date,
        lead,
        settings.hour,
        settings.minute,
      );
      if (date && date.getTime() > now) {
        pending.push({
          date,
          taskId: task.id,
          title: task.title,
          dueDate: task.due_date,
        });
      }
    }
  }

  pending.sort((a, b) => a.date.getTime() - b.date.getTime());
  return pending.slice(0, MAX_SCHEDULED);
}
