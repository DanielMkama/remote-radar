import { SearchX } from "lucide-react";
import { GrantCard } from "./grant-card";
import type { Grant } from "@/lib/grants/types";

interface GrantListProps {
  grants: Grant[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function GrantList({
  grants,
  emptyTitle = "No opportunities match your filters",
  emptyDescription = "Try a different category or clearing the search.",
}: GrantListProps) {
  if (grants.length === 0) {
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
      {grants.map((grant) => (
        <GrantCard key={grant.id} grant={grant} />
      ))}
    </div>
  );
}
