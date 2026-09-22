import { Card, CardContent } from "@/components/ui/card";

/** Route-level loading state while app/page.tsx fetches from Supabase. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardContent className="h-16 animate-pulse" />
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="h-24 animate-pulse" />
      </Card>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="h-28 animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}
