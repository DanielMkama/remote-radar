import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, ExternalLink, Landmark, Link2, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFallbackGrants } from "@/lib/grants/fallback";
import { getGrantById } from "@/lib/grants/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatGrantAmount, formatGrantCategory, formatGrantDeadline, formatGrantStatus } from "@/lib/grants/format";
import { getApplicationGuidance } from "@/lib/grants/guidance";
import type { Grant } from "@/lib/grants/types";

// Pre-renders the curated dataset's pages at build time; real (Supabase)
// ids are looked up dynamically below and rendered on demand.
export async function generateStaticParams() {
  const grants = await getFallbackGrants();
  return grants.map((grant) => ({ id: grant.id }));
}

async function findGrant(id: string): Promise<Grant | null> {
  const fallbackMatch = (await getFallbackGrants()).find((g) => g.id === id);
  if (fallbackMatch) return fallbackMatch;

  try {
    const client = getSupabaseServiceClient();
    return await getGrantById(client, id);
  } catch {
    return null;
  }
}

export default async function GrantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grant = await findGrant(id);

  if (!grant) notFound();

  const guidance = getApplicationGuidance(grant);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/grants"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to grants
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{grant.title}</h1>
              <Badge variant="outline">{formatGrantStatus(grant.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{grant.organization}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4" /> {formatGrantDeadline(grant)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tags className="size-4" /> {formatGrantCategory(grant.category)}
          </span>
        </div>

        {(grant.sourceCount ?? 0) > 1 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="size-4" /> Found on {grant.sourceCount} sources
            </span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Funding amount</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatGrantAmount(grant.amount)}</p>
          </div>
          <Button render={<a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" />}>
            Apply
            <ExternalLink className="size-4" />
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold">{guidance.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{guidance.intro}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {guidance.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {grant.eligibilityText && (
        <div>
          <h2 className="text-sm font-semibold">Location / Eligibility</h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
            <Landmark className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {grant.eligibilityText}
          </p>
        </div>
      )}

      {grant.focusText && (
        <div>
          <h2 className="text-sm font-semibold">Eligible disciplines / focus</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{grant.focusText}</p>
        </div>
      )}

      {grant.description && (
        <div>
          <h2 className="text-sm font-semibold">Description</h2>
          <div className="mt-2 space-y-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
            {grant.description}
          </div>
        </div>
      )}

      {grant.tags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {grant.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
