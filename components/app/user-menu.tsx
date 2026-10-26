"use client";

import { Building2Icon, CheckIcon, ChevronsUpDownIcon, LogOutIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemberRole } from "@/db/schema/enums";
import { signOut } from "@/server/actions/auth";
import { switchOrganisation } from "@/server/actions/organisation";

type Props = {
  userEmail: string | null;
  role: MemberRole;
  activeOrgId: string;
  activeOrgName: string;
  memberships: { orgId: string; orgName: string }[];
};

export function UserMenu({ userEmail, role, activeOrgId, activeOrgName, memberships }: Props) {
  const [pending, startTransition] = useTransition();

  function onSwitch(orgId: string) {
    if (orgId === activeOrgId) return;
    startTransition(async () => {
      const result = await switchOrganisation({ orgId });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto max-w-64 justify-start gap-2 px-2 py-1.5" disabled={pending}>
          <Building2Icon className="size-4 text-primary" />
          <span className="flex min-w-0 flex-col items-start text-left leading-tight">
            <span className="truncate text-sm font-medium">{activeOrgName}</span>
            <span className="truncate text-xs font-normal text-muted-foreground capitalize">{role}</span>
          </span>
          <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{userEmail}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
          {memberships.map((m) => (
            <DropdownMenuItem key={m.orgId} onSelect={() => onSwitch(m.orgId)}>
              <span className="truncate">{m.orgName}</span>
              {m.orgId === activeOrgId && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link href="/onboarding?new=1">
              <PlusIcon className="size-4" /> New workspace
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => signOut())}>
          <LogOutIcon className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
