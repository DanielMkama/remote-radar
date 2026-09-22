import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Bookmark, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];
