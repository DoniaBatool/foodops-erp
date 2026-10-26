import Link from "next/link";
import { Suspense } from "react";

import { AppNav } from "@/components/app/app-nav";
import { Brand } from "@/components/app/brand";
import { OrgMenu } from "@/components/app/org-menu";
import { OrgMenuSkeleton, PageSkeleton } from "@/components/app/skeletons";

// The shell (nav, brand) is static and renders instantly. Anything that reads the session
// (org menu, page content) streams in behind <Suspense> (Next.js 16 Cache Components).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-5 md:flex">
        <Link href="/dashboard" className="px-3">
          <Brand />
        </Link>
        <AppNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="md:hidden">
              <Brand />
            </Link>
            <div className="ml-auto">
              <Suspense fallback={<OrgMenuSkeleton />}>
                <OrgMenu />
              </Suspense>
            </div>
          </div>
          <div className="-mx-1 pb-1 md:hidden">
            <AppNav orientation="horizontal" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
