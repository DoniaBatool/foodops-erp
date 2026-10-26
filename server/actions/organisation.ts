"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb, type Tx } from "@/db";
import { locations, organisations, orgMembers, profiles, type LocationType } from "@/db/schema";
import { fail, fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { setActiveOrgCookie } from "@/lib/org-cookie";
import {
  COUNTRIES,
  createOrganisationSchema,
  slugify,
  type CreateOrganisationInput,
} from "@/lib/validation/organisation";

/** Created with every new organisation; editable later in Settings > Locations. */
const DEFAULT_LOCATIONS: { name: string; type: LocationType }[] = [
  { name: "Dry Store", type: "ambient" },
  { name: "Chiller", type: "chilled" },
  { name: "Freezer", type: "frozen" },
  { name: "Quarantine", type: "quarantine" },
  { name: "Production Area", type: "production" },
];

async function uniqueSlug(tx: Tx, name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 35)}-${Math.random().toString(36).slice(2, 6)}`;
    const taken = await tx.select({ id: organisations.id }).from(organisations).where(eq(organisations.slug, candidate));
    if (taken.length === 0) return candidate;
  }
  throw new Error("Could not generate a unique organisation slug");
}

export async function createOrganisation(input: CreateOrganisationInput): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = createOrganisationSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsOf(parsed.error));
  }
  const { name, country, defaultVatRate } = parsed.data;
  const settings = COUNTRIES[country];

  const orgId = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('foodops.user_id', ${user.id}, true)`);

    const [org] = await tx
      .insert(organisations)
      .values({
        name,
        slug: await uniqueSlug(tx, name),
        country,
        currency: settings.currency,
        timezone: settings.timezone,
        defaultVatRate,
      })
      .returning({ id: organisations.id });
    if (!org) throw new Error("Organisation insert returned no row");

    await tx.insert(orgMembers).values({ orgId: org.id, userId: user.id, role: "owner" });
    await tx.insert(profiles).values({ id: user.id, fullName: user.fullName }).onConflictDoNothing();
    await tx.insert(locations).values(DEFAULT_LOCATIONS.map((l) => ({ ...l, orgId: org.id })));

    return org.id;
  });

  await setActiveOrgCookie(orgId);
  redirect("/dashboard");
}

const switchOrgSchema = z.object({ orgId: z.uuid() });

/** Org switcher. The cookie is only a preference; membership is checked here and again in getOrgContext(). */
export async function switchOrganisation(input: { orgId: string }): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = switchOrgSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Unknown organisation.");
  }

  const membership = await getDb()
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, parsed.data.orgId), eq(orgMembers.userId, user.id)));
  if (membership.length === 0) {
    return fail("You are not a member of that organisation.");
  }

  await setActiveOrgCookie(parsed.data.orgId);
  redirect("/dashboard");
}
