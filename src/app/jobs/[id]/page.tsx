import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Building2, Briefcase, ExternalLink, ShieldCheck, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "@/components/jobs/save-button";
import { MatchScoreBadge } from "@/components/jobs/match-score-badge";
import { MOCK_JOBS } from "@/lib/jobs/mock-data";
import { getOpportunityById } from "@/lib/opportunities/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSalary, formatNormalizedMonthly } from "@/lib/jobs/salary";
import {
  formatCategory,
  formatJobType,
  formatRelativeDate,
  formatAbsoluteDate,
  formatSource,
} from "@/lib/format";
import type { Job } from "@/lib/jobs/types";

// Pre-renders the 16 mock job pages at build time; real (Supabase) ids
// are looked up dynamically below and rendered on demand — dynamicParams
// defaults to true, so this restricts what's pre-built, not what's servable.
export function generateStaticParams() {
  return MOCK_JOBS.map((job) => ({ id: job.id }));
}

async function findJob(id: string): Promise<Job | null> {
  const mockMatch = MOCK_JOBS.find((j) => j.id === id);
  if (mockMatch) return mockMatch;

  try {
    const client = getSupabaseServiceClient();
    return await getOpportunityById(client, id);
  } catch {
    return null;
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await findJob(id);

  if (!job) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{job.title}</h1>
              {job.isWorldwide && (
                <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400">
                  Worldwide
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
          </div>
          <MatchScoreBadge score={job.matchScore} className="shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-4" /> {formatJobType(job.jobType)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-4" /> {formatSource(job.source)}
          </span>
          <span className="inline-flex items-center gap-1.5" title={formatAbsoluteDate(job.postedAt)}>
            <Clock className="size-4" /> Posted {formatRelativeDate(job.postedAt)}
          </span>
        </div>

        {/* Source-confidence signals (Phase 2 §16-17). Only present for
            real, Supabase-backed opportunities — mock jobs don't set these. */}
        {(job.verificationStatus || (job.sourceCount ?? 0) > 1) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {job.verificationStatus && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                {job.verificationStatus === "verified"
                  ? "Direct company application"
                  : job.verificationStatus === "likely"
                  ? "Likely legitimate (established job board)"
                  : "Unverified"}
              </span>
            )}
            {(job.sourceCount ?? 0) > 1 && (
              <span className="inline-flex items-center gap-1.5">
                <Link2 className="size-4" /> Found on {job.sourceCount} sources
              </span>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Salary</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatSalary(job.salary)}</p>
            {job.salary.period && job.salary.period !== "month" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Estimated monthly: {formatNormalizedMonthly(job.salary)} (not employer-stated, see
                normalization method)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SaveButton jobId={job.id} />
            <Button
              render={
                <a href={job.url} target="_blank" rel="noopener noreferrer" />
              }
            >
              Apply
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold">Description</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
          {job.description}
        </div>
      </div>

      {job.tags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline">{formatCategory(job.category)}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
