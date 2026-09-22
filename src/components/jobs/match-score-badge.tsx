import { cn } from "cn";
import { STRONG_MATCH_THRESHOLD } from "@/lib/jobs/filters";

/** Color-codes a 0–100 match score: strong / decent / weak. */
export function MatchScoreBadge({ score, className }: { score: number; className?: string }) {
  const tier =
    score >= STRONG_MATCH_THRESHOLD ? "strong" : score >= 50 ? "decent" : "weak";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        tier === "strong" && "border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400",
        tier === "decent" && "border-amber-600/20 bg-amber-600/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400",
        tier === "weak" && "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {score}% match
    </span>
  );
}
