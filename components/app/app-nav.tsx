"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { BUILT_PATHS, NAV_ITEMS } from "./nav-items";

export function AppNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={cn(orientation === "vertical" ? "flex flex-col gap-0.5" : "flex gap-1 overflow-x-auto")}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const built = BUILT_PATHS.has(href);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const base = cn(
          "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          orientation === "horizontal" && "gap-2 px-2.5",
        );

        if (!built) {
          return (
            <span
              key={href}
              aria-disabled
              title="Coming soon"
              className={cn(base, "cursor-not-allowed text-muted-foreground/60")}
            >
              <Icon className="size-4" />
              {label}
              {orientation === "vertical" && (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide">
                  Soon
                </span>
              )}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              base,
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
