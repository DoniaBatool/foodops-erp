import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null; fullName: string | null };

/**
 * The signed-in user, verified from the Supabase JWT (getClaims verifies the signature).
 * Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks compare the JWT expiry with the current time (Date.now), so they must run
  // at request time, never during prerender (Next.js 16 Cache Components).
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return null;
  }
  const { email, user_metadata: meta } = data.claims;
  const fullName = meta && typeof meta.full_name === "string" ? meta.full_name : null;
  return { id: data.claims.sub, email: typeof email === "string" ? email : null, fullName };
});
