import { getOrgContext, listMemberships } from "@/lib/org-context";

import { UserMenu } from "./user-menu";

/** Server part of the top-bar menu: reads the session, so it renders inside <Suspense>. */
export async function OrgMenu() {
  const ctx = await getOrgContext();
  const memberships = await listMemberships(ctx.userId);

  return (
    <UserMenu
      userEmail={ctx.userEmail}
      role={ctx.role}
      activeOrgId={ctx.orgId}
      activeOrgName={ctx.orgName}
      memberships={memberships.map(({ orgId, orgName }) => ({ orgId, orgName }))}
    />
  );
}
