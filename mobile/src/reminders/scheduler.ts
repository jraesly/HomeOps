import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/api/types';
import { formatDate } from '@/utils/format';
import {
  buildPendingReminders,
  scheduleSignature,
} from './schedule-logic';
import type { ReminderSettings } from './settings';

const ANDROID_CHANNEL_ID = 'task-reminders';

let handlerConfigured = false;

// Skip rescheduling when the reminder-relevant state is unchanged.
let lastSignature: string | null = null;

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

/**
 * Cancel and reschedule local reminders from the task list and settings.
 * No-op on web, and skipped entirely when nothing relevant has changed.
 */
export async function syncReminders(
  tasks: Task[],
  settings: ReminderSettings,
): Promise<void> {
  if (Platform.OS === 'web') return;

  const signature = scheduleSignature(tasks, settings);
  if (signature === lastSignature) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const pending = buildPendingReminders(tasks, settings, Date.now());
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
