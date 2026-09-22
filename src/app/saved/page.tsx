"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { JobList } from "@/components/jobs/job-list";
import { useSavedJobs } from "@/context/saved-jobs-context";
import { MOCK_JOBS } from "@/lib/jobs/mock-data";
import { sortJobs } from "@/lib/jobs/filters";
import type { Job } from "@/lib/jobs/types";

export default function SavedJobsPage() {
  const { savedIds } = useSavedJobs();
  const [remoteJobs, setRemoteJobs] = useState<Job[]>([]);

  // Saved job ids can point at either real (Supabase) opportunities or
  // mock fixtures (if they were saved before Supabase was configured).
  // Fetch the real list client-side and merge both pools below so a
  // saved id resolves either way; an API error just means we fall back
  // to mock-only, which still resolves any mock-sourced saves.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/opportunities")
      .then((res) => (res.ok ? res.json() : { jobs: [] }))
      .then((data) => {
        if (!cancelled) setRemoteJobs(data.jobs ?? []);
      })
      .catch(() => {
        if (!cancelled) setRemoteJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const savedJobs = useMemo(() => {
    const savedSet = new Set(savedIds);
    const pool = new Map<string, Job>();
    for (const job of [...MOCK_JOBS, ...remoteJobs]) pool.set(job.id, job);
    return sortJobs(
      Array.from(pool.values()).filter((job) => savedSet.has(job.id)),
      "newest"
    );
  }, [savedIds, remoteJobs]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Bookmark className="size-5 text-muted-foreground" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold tracking-tight">Saved Jobs</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs you&apos;ve bookmarked, kept on this device.
        </p>
      </div>

      <JobList
        jobs={savedJobs}
        emptyTitle="No saved jobs yet"
        emptyDescription="Save a job from the dashboard to keep track of it here."
      />
    </div>
  );
}
