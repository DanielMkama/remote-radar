"use client";

import { Bookmark } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/context/saved-jobs-context";

interface SaveButtonProps {
  jobId: string;
  className?: string;
  /** "icon" for compact card use, "default" to show the "Save"/"Saved" label. */
  variant?: "icon" | "default";
}

export function SaveButton({ jobId, className, variant = "default" }: SaveButtonProps) {
  const { isSaved, toggleSave } = useSavedJobs();
  const saved = isSaved(jobId);

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size={variant === "icon" ? "icon" : "default"}
      className={className}
      aria-pressed={saved}
      onClick={() => toggleSave(jobId)}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {variant === "default" && (saved ? "Saved" : "Save")}
    </Button>
  );
}
