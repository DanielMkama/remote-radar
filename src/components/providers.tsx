"use client";

import type { ReactNode } from "react";
import { SavedJobsProvider } from "@/context/saved-jobs-context";
import { PreferencesProvider } from "@/context/preferences-context";

/** Client-side context providers, kept out of the root layout for clarity. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <SavedJobsProvider>{children}</SavedJobsProvider>
    </PreferencesProvider>
  );
}
