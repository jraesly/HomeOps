import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type {
  TaskReminderOverride,
  TaskReminderOverrides,
} from './schedule-logic';

/**
 * Persists per-task reminder overrides (mute / custom lead times) locally,
 * consistent with the on-device, per-device reminder model.
 */
const STORAGE_KEY = 'homeops.taskReminderOverrides.v1';

let overrides: TaskReminderOverrides = {};
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export async function hydrateTaskOverrides(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      overrides = JSON.parse(raw) as TaskReminderOverrides;
      emit();
    }
  } catch {
    // Unavailable storage — fall back to no overrides.
  }
}

export function getTaskOverrides(): TaskReminderOverrides {
  return overrides;
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Best-effort.
  }
}

/** Merge a patch into a task's override; an empty result is removed. */
export async function setTaskOverride(
  taskId: string,
  patch: TaskReminderOverride | null,
): Promise<void> {
  const next = { ...overrides };
  if (patch === null) {
    delete next[taskId];
  } else {
    const merged = { ...next[taskId], ...patch };
    // Drop keys that fall back to the global default.
    if (merged.muted === false) delete merged.muted;
    if (merged.leadDays === undefined) delete merged.leadDays;
    if (Object.keys(merged).length === 0) delete next[taskId];
    else next[taskId] = merged;
  }
  overrides = next;
  emit();
  await persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTaskOverrides(): TaskReminderOverrides {
  return useSyncExternalStore(subscribe, getTaskOverrides, getTaskOverrides);
}

export function useTaskOverride(taskId: string): TaskReminderOverride {
  return useTaskOverrides()[taskId] ?? {};
}
