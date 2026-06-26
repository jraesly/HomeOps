import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useCurrentHome, useHomeTasks } from '@/api/hooks';
import { hydrateSelectedHome } from '@/homes/selected-home';
import {
  configureNotificationHandler,
  syncReminders,
} from '@/reminders/scheduler';
import { hydrateSettings, useReminderSettings } from '@/reminders/settings';

/**
 * Headless component (mounted in the root layout) that keeps local task
 * reminders in sync with the backend task list and the user's settings, and
 * routes notification taps to the relevant task.
 */
export function ReminderSync() {
  const router = useRouter();
  const settings = useReminderSettings();
  const homeQuery = useCurrentHome();
  const tasksQuery = useHomeTasks(homeQuery.data?.id);
  const tasks = tasksQuery.data;

  useEffect(() => {
    configureNotificationHandler();
    void hydrateSettings();
    void hydrateSelectedHome();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId;
        if (typeof taskId === 'string') {
          router.push(`/task/${taskId}`);
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!tasks) return;
    void syncReminders(tasks, settings);
  }, [tasks, settings]);

  return null;
}
