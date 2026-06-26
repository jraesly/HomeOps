import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Persists which home is currently selected so the app remembers it across
 * launches and supports switching between multiple homes.
 */
const STORAGE_KEY = 'homeops.selectedHomeId.v1';

let selectedHomeId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export async function hydrateSelectedHome(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      selectedHomeId = raw;
      emit();
    }
  } catch {
    // Storage unavailable — fall back to no selection.
  }
}

export function getSelectedHomeId(): string | null {
  return selectedHomeId;
}

export async function setSelectedHomeId(id: string | null): Promise<void> {
  selectedHomeId = id;
  emit();
  try {
    if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort persistence.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSelectedHomeId(): string | null {
  return useSyncExternalStore(
    subscribe,
    getSelectedHomeId,
    getSelectedHomeId,
  );
}
