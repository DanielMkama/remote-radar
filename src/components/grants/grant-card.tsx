import Link from "next/link";
import { Landmark, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatGrantAmount, formatGrantCategory, formatGrantDeadline, formatGrantStatus } from "@/lib/grants/format";
import type { Grant } from "@/lib/grants/types";

const STATUS_BADGE_CLASS: Record<string, string> = {
  open: "text-emerald-700 dark:text-emerald-400",
  upcoming: "text-sky-700 dark:text-sky-400",
  rolling: "text-violet-700 dark:text-violet-400",
  closed: "text-muted-foreground",
  unknown: "text-muted-foreground",
};

export function GrantCard({ grant }: { grant: Grant }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/grants/${grant.id}`} className="font-medium leading-snug hover:underline">
              {grant.title}
            </Link>
            <Badge variant="outline" className={STATUS_BADGE_CLASS[grant.status]}>
              {formatGrantStatus(grant.status)}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{grant.organization}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {formatGrantCategory(grant.category)}
            </Badge>
            <span className="inline-flex min-w-0 max-w-full items-center gap-1">
              <CalendarClock className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{formatGrantDeadline(grant)}</span>
            </span>
            {grant.eligibilityText && (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                <Landmark className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{grant.eligibilityText}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-row items-center justify-between gap-3 sm:w-48 sm:shrink-0 sm:flex-col sm:items-end">
          <p className="break-words text-right text-sm font-semibold tabular-nums">{formatGrantAmount(grant.amount)}</p>
          <Button size="sm" render={<Link href={`/grants/${grant.id}`} />}>
            View details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
