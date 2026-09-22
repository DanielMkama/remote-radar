import { SearchX } from "lucide-react";
import { JobCard } from "./job-card";
import type { Job } from "@/lib/jobs/types";

interface JobListProps {
  jobs: Job[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function JobList({
  jobs,
  emptyTitle = "No jobs match your filters",
  emptyDescription = "Try widening your salary range or clearing a filter.",
}: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
