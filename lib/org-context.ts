import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getDb, type Tx } from "@/db";
import { organisations, orgMembers, type MemberRole } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

/** UI preference only: which org the user last picked. Always re-validated against org_members. */
export const ACTIVE_ORG_COOKIE = "foodops_org";

export type OrgContext = {
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string | null;
  role: MemberRole;
};

export type Membership = { orgId: string; orgName: string; role: MemberRole };

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** All organisations the user belongs to, oldest first. */
export async function listMemberships(userId: string): Promise<Membership[]> {
  return getDb()
    .select({ orgId: orgMembers.orgId, orgName: organisations.name, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(organisations, eq(organisations.id, orgMembers.orgId))
    .where(eq(orgMembers.userId, userId))
    .orderBy(asc(orgMembers.createdAt));
}

/**
 * The ONLY way server code learns which org it is working in (spec 10.1).
 * - No session -> /login. No membership -> /onboarding.
 * - orgId and role come from the database row, never from the browser.
 */
export const getOrgContext = cache(async (): Promise<OrgContext> => {
  await connection(); // request-time only: session expiry uses the current time
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const memberships = await listMemberships(user.id);
  const first = memberships[0];
  if (!first) {
    redirect("/onboarding");
  }

  const preferred = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.orgId === preferred) ?? first;

  return {
    orgId: active.orgId,
    orgName: active.orgName,
    userId: user.id,
    userEmail: user.email,
    role: active.role,
  };
});

/** Throws ForbiddenError unless the user's role is in `allowed` (permission matrix, spec 6.3). */
export function requireRole(ctx: OrgContext, allowed: readonly MemberRole[]): void {
  if (!allowed.includes(ctx.role)) {
    throw new ForbiddenError();
  }
}

/** Role groups from the permission matrix (spec 6.3). */
export const ROLES = {
  masterData: ["owner", "admin", "manager"],
  goodsIn: ["owner", "admin", "manager", "operator"],
  stockAdjust: ["owner", "admin", "manager"],
  settings: ["owner", "admin"],
} as const satisfies Record<string, readonly MemberRole[]>;

/**
 * Runs `fn` in a transaction with the actor set for audit triggers.
 * Every query inside must still filter by ctx.orgId.
 */
export async function withOrgTx<T>(ctx: Pick<OrgContext, "orgId" | "userId">, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('foodops.user_id', ${ctx.userId}, true), set_config('foodops.org_id', ${ctx.orgId}, true)`,
    );
    return fn(tx);
  });
}
