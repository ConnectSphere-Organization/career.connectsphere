import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  getCollaborationActor,
  getRecruitmentActor,
} from "@/lib/auth/authorization";
import { recruitmentHome } from "@/lib/auth/recruitment-home";

export async function SiteShell({ children }: { children: ReactNode }) {
  const [actor, recruitmentActor] = await Promise.all([
    getCollaborationActor(),
    getRecruitmentActor(),
  ]);
  const employeeAccess =
    actor?.role === "EMPLOYEE" &&
    (actor.status === "ACTIVE" || actor.status === "FORMER");
  const hrWorkspaceHref = recruitmentActor
    ? recruitmentHome(recruitmentActor)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <SiteHeader
        employeeAccess={employeeAccess}
        hrWorkspaceHref={hrWorkspaceHref}
      />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <SiteFooter />
    </div>
  );
}
