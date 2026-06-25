import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** Lead times (in days before due date) the user can enable, plus a label. */
export const LEAD_TIME_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: 'On due date' },
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
];

export interface ReminderSettings {
  enabled: boolean;
  /** Days-before-due offsets to fire a reminder for (e.g. [0, 1]). */
  leadDays: number[];
  /** Hour of day (local, 0-23) reminders fire at. */
  hour: number;
  /** Minute of the hour (local, 0-59) reminders fire at. */
  minute: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  leadDays: [0],
  hour: 9,
  minute: 0,
};

const STORAGE_KEY = 'homeops.reminderSettings.v1';

let state: ReminderSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Load persisted settings once at startup. */
export async function hydrateSettings(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as ReminderSettings) };
      emit();
    }
  } catch {
    // Corrupt/unavailable storage — fall back to defaults.
  }
}

export function getSettings(): ReminderSettings {
  return state;
}

export async function updateSettings(
  patch: Partial<ReminderSettings>,
): Promise<void> {
  state = { ...state, ...patch };
  emit();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort persistence.
  }
}

export function toggleLeadDay(days: number): Promise<void> {
  const has = state.leadDays.includes(days);
  const leadDays = has
    ? state.leadDays.filter((d) => d !== days)
    : [...state.leadDays, days].sort((a, b) => a - b);
  return updateSettings({ leadDays });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReminderSettings(): ReminderSettings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
