"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  JOB_CATEGORIES,
  type JobCategory,
  type JobFilters,
  type JobType,
  type SalaryDisclosure,
  type SortOption,
} from "@/lib/jobs/types";
import { TARGET_CATEGORIES, TARGET_EMPLOYMENT_TYPES } from "@/lib/jobs/filters";

interface JobFiltersBarProps {
  filters: JobFilters;
  onFiltersChange: (next: JobFilters) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const ALL_CATEGORIES_VALUE = "all";

const EMPLOYMENT_TYPE_OPTIONS: { value: string; label: string; types: JobType[] }[] = [
  { value: "full-part", label: "Full-time + Part-time", types: TARGET_EMPLOYMENT_TYPES ?? [] },
  { value: "all", label: "All types", types: [] },
  { value: "full-time", label: "Full-time only", types: ["full-time"] },
  { value: "part-time", label: "Part-time only", types: ["part-time"] },
  { value: "contract", label: "Contract only", types: ["contract"] },
  { value: "freelance", label: "Freelance only", types: ["freelance"] },
];

export function JobFiltersBar({ filters, onFiltersChange, sort, onSortChange }: JobFiltersBarProps) {
  const selectedCategory: string =
    filters.categories && filters.categories.length === 1 ? filters.categories[0] : ALL_CATEGORIES_VALUE;

  const selectedEmploymentOption =
    EMPLOYMENT_TYPE_OPTIONS.find(
      (opt) =>
        opt.types.length === (filters.employmentTypes?.length ?? 0) &&
        opt.types.every((t) => filters.employmentTypes?.includes(t))
    )?.value ?? "all";

  const patch = (next: Partial<JobFilters>) => onFiltersChange({ ...filters, ...next });

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-1 flex-col gap-1.5 lg:min-w-[220px]">
          <Label htmlFor="job-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="job-search"
              placeholder="Title or company…"
              className="pl-8"
              value={filters.search ?? ""}
              onChange={(e) => patch({ search: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              patch({
                categories: value === ALL_CATEGORIES_VALUE ? TARGET_CATEGORIES : [value as JobCategory],
              })
            }
          >
            <SelectTrigger id="job-category" className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>
              {JOB_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="min-salary">Min salary / mo</Label>
          <Input
            id="min-salary"
            type="number"
            inputMode="numeric"
            className="w-full lg:w-28"
            placeholder="$500"
            value={filters.minMonthlySalary ?? ""}
            onChange={(e) =>
              patch({ minMonthlySalary: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max-salary">Max salary / mo</Label>
          <Input
            id="max-salary"
            type="number"
            inputMode="numeric"
            className="w-full lg:w-28"
            placeholder="$2,000"
            value={filters.maxMonthlySalary ?? ""}
            onChange={(e) =>
              patch({ maxMonthlySalary: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <Switch
            id="worldwide-only"
            checked={filters.worldwideOnly ?? false}
            onCheckedChange={(checked) => patch({ worldwideOnly: checked })}
          />
          <Label htmlFor="worldwide-only" className="cursor-pointer">
            Worldwide only
          </Label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employment-type">Employment type</Label>
          <Select
            value={selectedEmploymentOption}
            onValueChange={(value) => {
              const option = EMPLOYMENT_TYPE_OPTIONS.find((opt) => opt.value === value);
              patch({ employmentTypes: option?.types ?? [] });
            }}
          >
            <SelectTrigger id="employment-type" className="w-full lg:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="salary-disclosure">Salary</Label>
          <Select
            value={filters.salaryDisclosure ?? "all"}
            onValueChange={(value) => patch({ salaryDisclosure: value as SalaryDisclosure })}
          >
            <SelectTrigger id="salary-disclosure" className="w-full lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="disclosed">Salary disclosed</SelectItem>
              <SelectItem value="undisclosed">Salary not disclosed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sort-by">Sort by</Label>
          <Select value={sort} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger id="sort-by" className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="salary-desc">Salary: High to Low</SelectItem>
              <SelectItem value="salary-asc">Salary: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
