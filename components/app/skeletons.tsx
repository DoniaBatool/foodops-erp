import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Shown while a page streams in behind the app shell (Cache Components). */
export function PageSkeleton() {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <Block className="h-7 w-48" />
        <Block className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}

export function OrgMenuSkeleton() {
  return <Block className="h-11 w-48" />;
}

export function CardSkeleton() {
  return <Block className="h-80 w-full rounded-xl" />;
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Block className="h-4 w-20" />
          <Block className="h-9 w-full" />
        </div>
      ))}
      <Block className="h-9 w-full" />
    </div>
  );
}
