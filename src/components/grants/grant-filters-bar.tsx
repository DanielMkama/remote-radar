"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { GRANT_CATEGORIES, GRANT_STATUSES, type GrantCategory, type GrantFilters, type GrantSortOption, type GrantStatus } from "@/lib/grants/types";

interface GrantFiltersBarProps {
  filters: GrantFilters;
  onFiltersChange: (next: GrantFilters) => void;
  sort: GrantSortOption;
  onSortChange: (sort: GrantSortOption) => void;
}

const ALL_VALUE = "all";

export function GrantFiltersBar({ filters, onFiltersChange, sort, onSortChange }: GrantFiltersBarProps) {
  const selectedCategory: string =
    filters.categories && filters.categories.length === 1 ? filters.categories[0] : ALL_VALUE;
  const selectedStatus: string = filters.statuses && filters.statuses.length === 1 ? filters.statuses[0] : ALL_VALUE;

  const patch = (next: Partial<GrantFilters>) => onFiltersChange({ ...filters, ...next });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-5 lg:gap-y-4">
        <div className="flex flex-1 flex-col gap-1.5 lg:min-w-[220px]">
          <Label htmlFor="grant-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="grant-search"
              placeholder="Title, organization or focus…"
              className="pl-8"
              value={filters.search ?? ""}
              onChange={(e) => patch({ search: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grant-category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              patch({ categories: value === ALL_VALUE ? [] : [value as GrantCategory] })
            }
          >
            <SelectTrigger id="grant-category" className="w-full lg:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All categories</SelectItem>
              {GRANT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grant-status">Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => patch({ statuses: value === ALL_VALUE ? [] : [value as GrantStatus] })}
          >
            <SelectTrigger id="grant-status" className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Any status</SelectItem>
              {GRANT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grant-sort-by">Sort by</Label>
          <Select value={sort} onValueChange={(value) => onSortChange(value as GrantSortOption)}>
            <SelectTrigger id="grant-sort-by" className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline-asc">Deadline: Soonest</SelectItem>
              <SelectItem value="newest">Newest added</SelectItem>
              <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
              <SelectItem value="title-asc">Title: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
