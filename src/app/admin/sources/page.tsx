import { Activity, CircleCheck, CircleX, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SOURCE_REGISTRY } from "@/lib/sources/registry";
import { listLatestSourceRuns, type LatestSourceRun } from "@/lib/opportunities/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/format";

async function getRuns(): Promise<{ runs: Map<string, LatestSourceRun>; error?: string }> {
  try {
    const client = getSupabaseServiceClient();
    const runs = await listLatestSourceRuns(client);
    return { runs: new Map(runs.map((r) => [r.source, r])) };
  } catch (err) {
    return { runs: new Map(), error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function SourcesAdminPage() {
  const { runs, error } = await getRuns();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-muted-foreground" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingestion status per source. Run <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm run ingest</code> to
          refresh.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Run history unavailable: Supabase isn&apos;t configured ({error}). The registry below still
          shows every known source.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {SOURCE_REGISTRY.map((source) => {
          const run = runs.get(source.id);
          return (
            <Card key={source.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{source.name}</p>
                    <StatusBadge status={source.status} runStatus={run?.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{source.notes}</p>
                </div>

                {source.status === "active" ? (
                  run ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                      <Stat
                        label="Last success"
                        value={run.lastSuccessAt ? formatRelativeDate(run.lastSuccessAt) : "Never"}
                      />
                      <Stat
                        label="Last attempt"
                        value={run.lastAttemptAt ? formatRelativeDate(run.lastAttemptAt) : "Never"}
                      />
                      <Stat label="Found / New" value={`${run.designCount} / ${run.newCount}`} />
                      <Stat label="Updated / Dup." value={`${run.updatedCount} / ${run.duplicateCount}`} />
                    </div>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" /> Not run yet
                    </p>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">Not yet implemented</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status, runStatus }: { status: string; runStatus?: "ok" | "error" }) {
  if (status === "planned") {
    return (
      <Badge variant="outline" className="font-normal">
        Planned
      </Badge>
    );
  }
  if (runStatus === "error") {
    return (
      <Badge variant="destructive" className="gap-1 font-normal">
        <CircleX className="size-3" /> Error
      </Badge>
    );
  }
  if (runStatus === "ok") {
    return (
      <Badge variant="outline" className="gap-1 font-normal text-emerald-700 dark:text-emerald-400">
        <CircleCheck className="size-3" /> Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Active
    </Badge>
  );
}
