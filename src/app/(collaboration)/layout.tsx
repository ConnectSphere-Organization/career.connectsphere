import {
  Bell,
  BriefcaseBusiness,
  Home,
  IdCard,
  MessageSquareText,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireCollaborationActor } from "@/lib/auth/authorization";
import { hasStaffReferralAccess } from "@/lib/auth/policy";
import { SessionControl } from "@/modules/auth/components/session-control";

export default async function CollaborationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireCollaborationActor();
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-blue-400 uppercase">
              ConnectSphere Careers
            </p>
            <p className="mt-1 text-xl font-extrabold">
              Collaboration workspace
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Collaboration navigation"
          >
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
              href="/"
            >
              <Home className="size-4" />
              Home
            </Link>
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
              href="/notifications"
            >
              <Bell className="size-4" />
              Notifications
            </Link>
            {actor.role === "EMPLOYEE" ? (
              <>
                <Link
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                  href="/employee/profile"
                >
                  <IdCard className="size-4" />
                  Profile
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                  href="/employee/review"
                >
                  <Star className="size-4" />
                  My review
                </Link>
              </>
            ) : null}
            {hasStaffReferralAccess(actor.role, actor.status) ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/employee/recommendations"
              >
                <BriefcaseBusiness className="size-4" />
                Refer candidate
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canManageReviews ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/reviews"
              >
                <MessageSquareText className="size-4" />
                Reviews
              </Link>
            ) : null}
            {actor.isAdministrator ||
            actor.permissions.canManageRecommendations ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/recommendations"
              >
                <ShieldCheck className="size-4" />
                Review referrals
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canManageEmployees ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/notifications"
              >
                <Bell className="size-4" />
                All alerts
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canManageEmployees ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/users"
              >
                <Users className="size-4" />
                Users
              </Link>
            ) : null}
            {actor.isAdministrator || actor.permissions.canManageEmployees ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/employees"
              >
                <UserCog className="size-4" />
                Employees
              </Link>
            ) : null}
            {actor.isAdministrator ||
            actor.permissions.canManageAttendance ||
            actor.permissions.canManageLeave ||
            actor.permissions.canManagePayroll ||
            actor.permissions.canManageExits ||
            actor.permissions.canManageDocuments ||
            actor.permissions.canManageInterviews ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/operations"
              >
                <Workflow className="size-4" />
                Operations
              </Link>
            ) : null}
            {actor.isSuperAdmin ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/hr"
              >
                <UserCog className="size-4" />
                HR access
              </Link>
            ) : null}
            {actor.isSuperAdmin ? (
              <Link
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
                href="/admin/audit-logs"
              >
                <ShieldCheck className="size-4" />
                Audit
              </Link>
            ) : null}
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
