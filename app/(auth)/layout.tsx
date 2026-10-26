import { Suspense } from "react";

import { Brand } from "@/components/app/brand";
import { CardSkeleton } from "@/components/app/skeletons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Brand className="text-xl" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<CardSkeleton />}>{children}</Suspense>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Stock, recipes, batches and traceability for food &amp; drink producers.
      </p>
    </main>
  );
}
