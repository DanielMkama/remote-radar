"use client";

/**
 * Saved jobs — Phase 1 keeps this entirely client-side in localStorage.
 * No auth/user account exists yet, so there's nowhere server-side to
 * attach a "saved" record to. Swapping this for a Supabase-backed table
 * once auth lands should only require changing this file.
 */

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { createLocalStorageStore, STORAGE_KEYS } from "@/lib/storage";

const savedJobsStore = createLocalStorageStore<string[]>(STORAGE_KEYS.savedJobs, []);

interface SavedJobsContextValue {
  savedIds: string[];
  isSaved: (jobId: string) => boolean;
  toggleSave: (jobId: string) => void;
}

const SavedJobsContext = createContext<SavedJobsContextValue | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const savedIds = useSyncExternalStore(
    savedJobsStore.subscribe,
    savedJobsStore.getSnapshot,
    savedJobsStore.getServerSnapshot
  );

  const toggleSave = (jobId: string) => {
    const current = savedJobsStore.getSnapshot();
    const next = current.includes(jobId)
      ? current.filter((id) => id !== jobId)
      : [...current, jobId];
    savedJobsStore.set(next);
  };

  const value: SavedJobsContextValue = {
    savedIds,
    isSaved: (jobId: string) => savedIds.includes(jobId),
    toggleSave,
  };

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs(): SavedJobsContextValue {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  return ctx;
}
