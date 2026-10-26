import { cn } from "@/lib/utils";

/** Wordmark: sage square with a terracotta dot (no external logo assets). */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span aria-hidden className="relative inline-block size-6 rounded-md bg-primary">
        <span className="absolute right-1 bottom-1 size-2 rounded-full bg-brand-accent" />
      </span>
      FoodOps
    </span>
  );
}
