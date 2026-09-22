"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar } from "lucide-react";
import { cn } from "cn";
import { NAV_ITEMS } from "./nav-items";

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

/** Nav links + brand mark, shared by the desktop sidebar and the mobile sheet. */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 items-center gap-2 px-4">
        <Radar className="size-5 text-foreground" strokeWidth={1.75} />
        <span className="text-sm font-semibold tracking-tight">Remote Design Radar</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">Source: Remotive (mock data)</p>
      </div>
    </div>
  );
}
