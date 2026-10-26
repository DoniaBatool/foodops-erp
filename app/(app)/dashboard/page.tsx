import type { Metadata } from "next";

import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrgContext } from "@/lib/org-context";

export const metadata: Metadata = { title: "Dashboard" };

// KPI tiles from spec 8.9. Values arrive as the modules ship (Weeks 2–5).
const KPIS = [
  { label: "Stock value", hint: "After Goods In (Week 2)" },
  { label: "Expiring in 7 days", hint: "After Goods In (Week 2)" },
  { label: "Low stock items", hint: "After Goods In (Week 2)" },
  { label: "Batches this week", hint: "After Production (Week 3)" },
  { label: "Orders to dispatch", hint: "After Orders (Week 4)" },
  { label: "Xero sync errors", hint: "After Xero (Week 5)" },
];

// Each page owns its <Suspense> boundary so client navigations show the skeleton instantly
// while session-dependent content streams in (Next.js 16 instant navigation).
export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const ctx = await getOrgContext();

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description={`${ctx.orgName} · signed in as ${ctx.role}`} />

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="gap-2">
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="tnum text-3xl text-muted-foreground/60">—</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{kpi.hint}</CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>Your workspace is ready. Next you will add your items, suppliers and customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Add raw materials, packaging and finished products (Items).</li>
            <li>Add suppliers and wholesale customers.</li>
            <li>Receive your first delivery at Goods In.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
