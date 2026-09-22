"use client";

import { SettingsIcon, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePreferences } from "@/context/preferences-context";
import { JOB_CATEGORIES, type JobCategory } from "@/lib/jobs/types";

export default function SettingsPage() {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  const toggleCategory = (category: JobCategory, checked: boolean) => {
    const next = checked
      ? [...preferences.categories, category]
      : preferences.categories.filter((c) => c !== category);
    updatePreferences({ categories: next });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-muted-foreground" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Your target criteria. Saved to this browser and used to seed the dashboard filters.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-semibold">Salary range (monthly)</h2>
            <p className="text-xs text-muted-foreground">
              Non-monthly listings are converted to a monthly estimate for comparison.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-min-salary">Minimum salary</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="settings-min-salary"
                    type="number"
                    inputMode="numeric"
                    className="w-36 pl-5.5"
                    value={preferences.minMonthlySalary}
                    onChange={(e) => updatePreferences({ minMonthlySalary: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-max-salary">Maximum salary</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="settings-max-salary"
                    type="number"
                    inputMode="numeric"
                    className="w-36 pl-5.5"
                    value={preferences.maxMonthlySalary}
                    onChange={(e) => updatePreferences({ maxMonthlySalary: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Worldwide only</h2>
              <p className="text-xs text-muted-foreground">
                Exclude jobs restricted to a specific country or region.
              </p>
            </div>
            <Switch
              checked={preferences.worldwideOnly}
              onCheckedChange={(checked) => updatePreferences({ worldwideOnly: checked })}
            />
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold">Roles</h2>
            <p className="text-xs text-muted-foreground">
              Design categories you want to see on the dashboard.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {JOB_CATEGORIES.map((category) => {
                const checked = preferences.categories.includes(category.value);
                return (
                  <label
                    key={category.value}
                    htmlFor={`role-${category.value}`}
                    className="flex cursor-pointer items-center gap-2.5 text-sm"
                  >
                    <Checkbox
                      id={`role-${category.value}`}
                      checked={checked}
                      onCheckedChange={(state) => toggleCategory(category.value, state === true)}
                    />
                    {category.label}
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-fit" onClick={resetPreferences}>
        <RotateCcw className="size-4" />
        Reset to defaults
      </Button>
    </div>
  );
}
