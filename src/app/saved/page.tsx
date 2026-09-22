"use client";

import { useMemo } from "react";
import { Bookmark } from "lucide-react";
import { JobList } from "@/components/jobs/job-list";
import { useSavedJobs } from "@/context/saved-jobs-context";
import { MOCK_JOBS } from "@/lib/jobs/mock-data";
import { sortJobs } from "@/lib/jobs/filters";

export default function SavedJobsPage() {
  const { savedIds } = useSavedJobs();

  const savedJobs = useMemo(() => {
    const savedSet = new Set(savedIds);
    return sortJobs(
      MOCK_JOBS.filter((job) => savedSet.has(job.id)),
      "newest"
    );
  }, [savedIds]);

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
