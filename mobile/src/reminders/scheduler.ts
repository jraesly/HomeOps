import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/api/types';
import { formatDate } from '@/utils/format';
import type { ReminderSettings } from './settings';

// iOS caps locally scheduled notifications at 64; stay comfortably under it.
const MAX_SCHEDULED = 60;
const ANDROID_CHANNEL_ID = 'task-reminders';

let handlerConfigured = false;

/** Show reminders as banners even when the app is foregrounded. */
export function configureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Task reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Request notification permission; returns true when granted. */
export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Build the local trigger date for a task at a given lead time. */
function triggerDateFor(dueIso: string, leadDays: number, hour: number): Date | null {
  const due = new Date(`${dueIso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  due.setDate(due.getDate() - leadDays);
  due.setHours(hour, 0, 0, 0);
  return due;
}

/**
 * Cancel all existing reminders and reschedule from the current task list and
 * settings. Called whenever tasks or settings change. No-op on web.
 */
export async function syncReminders(
  tasks: Task[],
  settings: ReminderSettings,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled || settings.leadDays.length === 0) return;

  await ensureAndroidChannel();

  const now = Date.now();
  const pending: { date: Date; task: Task }[] = [];

  for (const task of tasks) {
    if (task.status !== 'active' || !task.due_date) continue;
    for (const leadDays of settings.leadDays) {
      const date = triggerDateFor(task.due_date, leadDays, settings.hour);
      if (date && date.getTime() > now) {
        pending.push({ date, task });
      }
    }
  }

  pending.sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const { date, task } of pending.slice(0, MAX_SCHEDULED)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HomeOps reminder',
        body: `${task.title} — due ${formatDate(task.due_date)}`,
        data: { taskId: task.id },
        ...(Platform.OS === 'android'
          ? { channelId: ANDROID_CHANNEL_ID }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }
}
