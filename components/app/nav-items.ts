import {
  BoxesIcon,
  ChefHatIcon,
  FactoryIcon,
  LayoutDashboardIcon,
  PackageIcon,
  RouteIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Week of the 6-week plan in which the screen ships (spec 13). */
  week: number;
};

// Order follows spec 5.4. Items from later weeks render as "Soon" until built.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, week: 1 },
  { href: "/goods-in", label: "Goods In", icon: TruckIcon, week: 2 },
  { href: "/inventory", label: "Inventory", icon: WarehouseIcon, week: 2 },
  { href: "/production", label: "Production", icon: FactoryIcon, week: 3 },
  { href: "/recipes", label: "Recipes", icon: ChefHatIcon, week: 3 },
  { href: "/orders", label: "Orders", icon: ShoppingCartIcon, week: 4 },
  { href: "/traceability", label: "Traceability", icon: RouteIcon, week: 4 },
  { href: "/items", label: "Items", icon: PackageIcon, week: 1 },
  { href: "/suppliers", label: "Suppliers", icon: BoxesIcon, week: 1 },
  { href: "/customers", label: "Customers", icon: UsersIcon, week: 1 },
  { href: "/settings", label: "Settings", icon: SettingsIcon, week: 1 },
];

/** Screens that exist in the codebase today. Add a path here when its page ships. */
export const BUILT_PATHS = new Set<string>(["/dashboard"]);
