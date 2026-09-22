import Link from "next/link";
import { MapPin, Clock, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchScoreBadge } from "./match-score-badge";
import { SaveButton } from "./save-button";
import { formatSalary } from "@/lib/jobs/salary";
import { formatCategory, formatRelativeDate, formatSource } from "@/lib/format";
import type { Job } from "@/lib/jobs/types";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="font-medium leading-snug hover:underline"
            >
              {job.title}
            </Link>
            {job.isWorldwide && (
              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400">
                Worldwide
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {formatCategory(job.category)}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatRelativeDate(job.postedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" /> {formatSource(job.source)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <MatchScoreBadge score={job.matchScore} />
            <p className="text-sm font-semibold tabular-nums">{formatSalary(job.salary)}</p>
          </div>
          <div className="flex items-center gap-2">
            <SaveButton jobId={job.id} variant="icon" />
            <Button size="sm" render={<Link href={`/jobs/${job.id}`} />}>
              View Job
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
