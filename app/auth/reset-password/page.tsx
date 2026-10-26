import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Brand } from "@/components/app/brand";
import { CardSkeleton } from "@/components/app/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the reset email via /auth/confirm, which signs the user in first.
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Brand className="text-xl" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<CardSkeleton />}>
          <ResetPasswordCard />
        </Suspense>
      </div>
    </main>
  );
}

async function ResetPasswordCard() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?error=link");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>For {user.email ?? "your account"}.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
