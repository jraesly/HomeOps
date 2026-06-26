import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/api/types';
import { formatDate } from '@/utils/format';
import {
  buildPendingReminders,
  scheduleSignature,
  type TaskReminderOverrides,
} from './schedule-logic';
import type { ReminderSettings } from './settings';

const ANDROID_CHANNEL_ID = 'task-reminders';
export const REMINDER_CATEGORY = 'task-reminder';
export const ACTION_COMPLETE = 'COMPLETE';
export const ACTION_SNOOZE = 'SNOOZE';

let handlerConfigured = false;

// Skip rescheduling when the reminder-relevant state is unchanged.
let lastSignature: string | null = null;

/** Show reminders as banners (foregrounded) and register their action buttons. */
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
  void Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    { identifier: ACTION_COMPLETE, buttonTitle: 'Complete' },
    { identifier: ACTION_SNOOZE, buttonTitle: 'Snooze 1 day' },
  ]);
}

/** Schedule a one-off reminder a day out (used by the Snooze action). */
export async function snoozeReminder(
  taskId: string,
  body: string,
  days = 1,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await ensureAndroidChannel();
  const date = new Date();
  date.setDate(date.getDate() + days);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HomeOps reminder',
      body,
      data: { taskId },
      categoryIdentifier: REMINDER_CATEGORY,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
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

/**
 * Cancel and reschedule local reminders from the task list and settings.
 * No-op on web, and skipped entirely when nothing relevant has changed.
 */
export async function syncReminders(
  tasks: Task[],
  settings: ReminderSettings,
  overrides: TaskReminderOverrides = {},
): Promise<void> {
  if (Platform.OS === 'web') return;

  const signature = scheduleSignature(tasks, settings, overrides);
  if (signature === lastSignature) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const pending = buildPendingReminders(tasks, settings, Date.now(), overrides);
  if (pending.length === 0) {
    lastSignature = signature;
    return;
  }

  await ensureAndroidChannel();

  for (const reminder of pending) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HomeOps reminder',
        body: `${reminder.title} — due ${formatDate(reminder.dueDate)}`,
        data: { taskId: reminder.taskId },
        categoryIdentifier: REMINDER_CATEGORY,
        ...(Platform.OS === 'android'
          ? { channelId: ANDROID_CHANNEL_ID }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
      },
    });
  }

  lastSignature = signature;
}
