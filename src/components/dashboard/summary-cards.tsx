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
      value: `$${targetMin.toLocaleString()}–$${targetMax.toLocaleString()}`,
      hint: "Target, per month",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            </div>
            <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
