import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FormError } from "@/components/app/form-error";
import { FormSkeleton } from "@/components/app/skeletons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// The card is static. Only the part that reads ?next / ?error streams in behind <Suspense>
// (Next.js 16 instant navigation).
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back. Sign in to your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<FormSkeleton fields={2} />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        New here?&nbsp;
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}

async function LoginFormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const linkError = params.error === "link";

  return (
    <div className="space-y-4">
      {linkError && <FormError message="That link is invalid or has expired. Sign in or request a new link." />}
      <LoginForm next={next} />
    </div>
  );
}
