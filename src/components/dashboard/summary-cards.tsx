import { Sparkles, Globe2, Inbox, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STRONG_MATCH_THRESHOLD } from "@/lib/jobs/filters";
import type { Job } from "@/lib/jobs/types";

interface SummaryCardsProps {
  jobs: Job[];
  targetMin: number;
  targetMax: number;
}

// Captured once at module load (not per-render) so computing "days since
// posted" stays a pure function of props during render, as React expects.
const loadedAt = Date.now();

/** The four top-of-dashboard stat cards, computed from the currently filtered job list. */
export function SummaryCards({ jobs, targetMin, targetMax }: SummaryCardsProps) {
  const newJobsCount = jobs.filter((job) => {
    const daysSincePosted = (loadedAt - new Date(job.postedAt).getTime()) / 86_400_000;
    return daysSincePosted <= 7;
  }).length;

  const strongMatches = jobs.filter((job) => job.matchScore >= STRONG_MATCH_THRESHOLD).length;
  const worldwideCount = jobs.filter((job) => job.isWorldwide).length;

  const cards = [
    {
      label: "New Jobs",
      value: newJobsCount,
      hint: "Posted in the last 7 days",
      icon: Inbox,
    },
    {
      label: "Strong Matches",
      value: strongMatches,
      hint: `${STRONG_MATCH_THRESHOLD}%+ match score`,
      icon: Sparkles,
    },
    {
      label: "Worldwide",
      value: worldwideCount,
      hint: "Open to any location",
      icon: Globe2,
    },
    {
      label: "Salary Range",
      value: `$${targetMin.toLocaleString()}-$${targetMax.toLocaleString()}`,
      hint: "Target, per month",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label} className="h-full">
          <CardContent className="flex h-full items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
              {/*
                No truncate/ellipsis: a wide value (e.g. a custom salary
                range like "$500-$12,500") should shrink to fit narrow
                mobile cards rather than get cut off with "…". Stays on one
                line (whitespace-nowrap); the card's own overflow-hidden is
                the only backstop for a truly extreme value, and clips
                silently (no ellipsis character) rather than truncating.
              */}
              <p className="whitespace-nowrap text-base font-semibold tracking-tight tabular-nums sm:text-xl">
                {value}
              </p>
              <p className="truncate text-xs text-muted-foreground">{hint}</p>
            </div>
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
