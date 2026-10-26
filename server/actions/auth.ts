"use server";

import { redirect } from "next/navigation";

import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/action-result";
import { publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
} from "@/lib/validation/auth";

export async function signIn(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // Same message for wrong email or password: do not reveal which accounts exist.
    return fail(error.code === "email_not_confirmed" ? "Please confirm your email first." : "Email or password is incorrect.");
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signUp(input: SignupInput): Promise<ActionResult<{ email: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
    },
  });
  if (error) {
    return fail(error.code === "weak_password" ? "Choose a stronger password." : "Could not create the account. Try again.");
  }

  // Email confirmation off (dev): Supabase returns a session straight away.
  if (data.session) {
    redirect("/onboarding");
  }
  return ok({ email: parsed.data.email });
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/auth/reset-password`,
  });
  // Always report success so the form cannot be used to discover accounts.
  return ok(undefined);
}

export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return fail("Your reset link has expired. Request a new one.");
  }
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
