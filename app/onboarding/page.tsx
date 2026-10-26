import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Brand } from "@/components/app/brand";
import { CardSkeleton } from "@/components/app/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { listMemberships } from "@/lib/org-context";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your workspace" };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Brand className="text-xl" />
      <div className="w-full max-w-md">
        <Suspense fallback={<CardSkeleton />}>
          <OnboardingCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function OnboardingCard({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  // Users who already belong to an org go to the app, unless they asked for another workspace.
  const { new: addAnother } = await searchParams;
  const memberships = await listMemberships(user.id);
  if (memberships.length > 0 && addAnother !== "1") {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your workspace</CardTitle>
        <CardDescription>
          {user.fullName ? `Hi ${user.fullName.split(" ")[0]}. ` : ""}Tell us about your company. You can change these
          later in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OnboardingForm />
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          We will create five storage locations to start with: Dry Store, Chiller, Freezer, Quarantine and Production
          Area.
        </div>
      </CardContent>
    </Card>
  );
}
