import type { Task } from '@/api/types';

/**
 * The soonest active, dated task for a device — used to show "next due" on
 * device cards. Returns null when the device has no scheduled work.
 */
export function nextDueTask(tasks: Task[], deviceId: string): Task | null {
  const candidates = tasks.filter(
    (task) =>
      task.device_id === deviceId &&
      task.status === 'active' &&
      task.due_date != null,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((soonest, task) =>
    (task.due_date as string) < (soonest.due_date as string) ? task : soonest,
  );
}
