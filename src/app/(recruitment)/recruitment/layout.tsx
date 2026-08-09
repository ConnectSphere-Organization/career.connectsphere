import {
  Award,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  FileLock2,
  FileSignature,
  LogOut,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  getCollaborationActor,
  requireRecruitmentActor,
} from "@/lib/auth/authorization";
import { SessionControl } from "@/modules/auth/components/session-control";

export default async function RecruitmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireRecruitmentActor();
  const collaborationActor = await getCollaborationActor();
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-blue-400 uppercase">
              ConnectSphere Careers
            </p>
            <p className="mt-1 text-xl font-extrabold">Recruitment workspace</p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Recruitment navigation"
          >
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
              href="/recruitment"
            >
              <BarChart3 className="size-4" />
              Dashboard
            </Link>
            {actor.isAdministrator || actor.permissions.canManageJobs ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/recruitment/jobs"
              >
                <BriefcaseBusiness className="size-4" />
                Jobs
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canViewApplicants ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/recruitment/applications"
              >
                <ClipboardList className="size-4" />
                Applications
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canManageInterviews ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/operations#interviews-heading"
              >
                <CalendarClock className="size-4" />
                Interviews
              </Link>
            ) : null}
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
              href="/employee/recommendations"
            >
              <BriefcaseBusiness className="size-4" />
              Refer candidate
            </Link>
            {actor.isAdministrator ||
            collaborationActor?.permissions.canManageRecommendations ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/recommendations"
              >
                <UserRoundCheck className="size-4" />
                Review referrals
              </Link>
            ) : null}
            {actor.isAdministrator ||
            actor.permissions.canGenerateOfferLetter ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/recruitment/offers"
              >
                <FileSignature className="size-4" />
                Offers
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canViewApplicants ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/recruitment/contracts"
              >
                <FileLock2 className="size-4" />
                Contracts
              </Link>
            ) : null}
            {actor.isAdministrator ||
            actor.permissions.canGenerateCertificate ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/recruitment/certificates"
              >
                <Award className="size-4" />
                Certificates
              </Link>
            ) : null}
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
              href="/"
            >
              <LogOut className="size-4" />
              Public site
            </Link>
            <SessionControl compact />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
