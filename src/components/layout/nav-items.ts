import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Bookmark, Settings, Activity, HandCoins } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/grants", label: "Grants & Funding", icon: HandCoins },
  { href: "/admin/sources", label: "Sources", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];
