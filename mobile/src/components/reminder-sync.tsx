import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { completeTask } from '@/api/endpoints';
import {
  useCreateHome,
  useCurrentHome,
  useHomeTasks,
  useHomes,
} from '@/api/hooks';
import { queryKeys } from '@/api/keys';
import { hydrateSelectedHome } from '@/homes/selected-home';
import {
  ACTION_COMPLETE,
  ACTION_SNOOZE,
  configureNotificationHandler,
  snoozeReminder,
  syncReminders,
} from '@/reminders/scheduler';
import { hydrateSettings, useReminderSettings } from '@/reminders/settings';
import {
  hydrateTaskOverrides,
  useTaskOverrides,
} from '@/reminders/task-overrides';

/**
 * Headless app-level component (mounted in the root layout) that:
 *  - hydrates persisted settings on start,
 *  - creates a default home the first time the app runs (explicit, guarded),
 *  - keeps local task reminders in sync with the task list and settings,
 *  - routes notification taps to the relevant task.
 */
export function ReminderSync() {
  const router = useRouter();
  const qc = useQueryClient();
  const settings = useReminderSettings();
  const overrides = useTaskOverrides();
  const homesQuery = useHomes();
  const createHome = useCreateHome();
  const homeQuery = useCurrentHome();
  const tasksQuery = useHomeTasks(homeQuery.data?.id);
  const tasks = tasksQuery.data;

  const bootstrapped = useRef(false);
  const homeIdRef = useRef<string | undefined>(undefined);
  homeIdRef.current = homeQuery.data?.id;

  useEffect(() => {
    configureNotificationHandler();
    void hydrateSettings();
    void hydrateSelectedHome();
    void hydrateTaskOverrides();
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
        const content = response.notification.request.content;
        const taskId = content.data?.taskId;
        if (typeof taskId !== 'string') return;

        if (response.actionIdentifier === ACTION_COMPLETE) {
          // Complete the task straight from the notification.
          completeTask(taskId, {})
            .then(() => {
              const homeId = homeIdRef.current;
              if (!homeId) return;
              qc.invalidateQueries({ queryKey: queryKeys.dashboard(homeId) });
              qc.invalidateQueries({ queryKey: queryKeys.homeTasks(homeId) });
              qc.invalidateQueries({ queryKey: queryKeys.devices(homeId) });
            })
            .catch(() => {
              // Network/auth failure — fall back to opening the task.
              router.push(`/task/${taskId}`);
            });
        } else if (response.actionIdentifier === ACTION_SNOOZE) {
          void snoozeReminder(taskId, content.body ?? 'Task reminder');
        } else {
          router.push(`/task/${taskId}`);
        }
      },
    );
    return () => sub.remove();
  }, [router, qc]);

  useEffect(() => {
    if (!tasks) return;
    void syncReminders(tasks, settings, overrides);
  }, [tasks, settings, overrides]);

  return null;
}
