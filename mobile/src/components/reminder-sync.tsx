import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  useCreateHome,
  useCurrentHome,
  useHomeTasks,
  useHomes,
} from '@/api/hooks';
import { hydrateSelectedHome } from '@/homes/selected-home';
import {
  configureNotificationHandler,
  syncReminders,
} from '@/reminders/scheduler';
import { hydrateSettings, useReminderSettings } from '@/reminders/settings';

/**
 * Headless app-level component (mounted in the root layout) that:
 *  - hydrates persisted settings on start,
 *  - creates a default home the first time the app runs (explicit, guarded),
 *  - keeps local task reminders in sync with the task list and settings,
 *  - routes notification taps to the relevant task.
 */
export function ReminderSync() {
  const router = useRouter();
  const settings = useReminderSettings();
  const homesQuery = useHomes();
  const createHome = useCreateHome();
  const homeQuery = useCurrentHome();
  const tasksQuery = useHomeTasks(homeQuery.data?.id);
  const tasks = tasksQuery.data;

  const bootstrapped = useRef(false);

  useEffect(() => {
    configureNotificationHandler();
    void hydrateSettings();
    void hydrateSelectedHome();
  }, []);

  // Bootstrap a default home exactly once when none exist.
  useEffect(() => {
    if (
      homesQuery.data &&
      homesQuery.data.length === 0 &&
      !bootstrapped.current &&
      !createHome.isPending
    ) {
      bootstrapped.current = true;
      createHome.mutate({ name: 'My Home' });
    }
  }, [homesQuery.data, createHome]);

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
