"use client";

/**
 * User preferences (target salary range, worldwide-only, target roles).
 * Phase 1 stores this in localStorage; the Settings page edits it. Once
 * auth exists, this moves to a `preferences` table keyed by user id.
 */

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { createLocalStorageStore, STORAGE_KEYS } from "@/lib/storage";
import { TARGET_CATEGORIES } from "@/lib/jobs/filters";
import type { UserPreferences } from "@/lib/jobs/types";

export const DEFAULT_PREFERENCES: UserPreferences = {
  minMonthlySalary: 500,
  maxMonthlySalary: 2000,
  worldwideOnly: true,
  categories: TARGET_CATEGORIES,
};

const preferencesStore = createLocalStorageStore<UserPreferences>(
  STORAGE_KEYS.preferences,
  DEFAULT_PREFERENCES
);

interface PreferencesContextValue {
  preferences: UserPreferences;
  setPreferences: (next: UserPreferences) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const preferences = useSyncExternalStore(
    preferencesStore.subscribe,
    preferencesStore.getSnapshot,
    preferencesStore.getServerSnapshot
  );

  const setPreferences = (next: UserPreferences) => preferencesStore.set(next);

  const value: PreferencesContextValue = {
    preferences,
    setPreferences,
    updatePreferences: (patch) => setPreferences({ ...preferencesStore.getSnapshot(), ...patch }),
    resetPreferences: () => setPreferences(DEFAULT_PREFERENCES),
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
