import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  LogOut,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { requireCollaborationActor } from "@/lib/auth/authorization";
import { OperationsActionPanel } from "@/modules/operations/components/operations-action-panel";
import { getOperationsDashboard } from "@/modules/operations/server/operations";

export const metadata: Metadata = {
  title: "People operations",
  robots: { index: false, follow: false },
};

const operationalPermissions = [
  "canManageEmployees",
  "canManageAttendance",
  "canManageLeave",
  "canManagePayroll",
  "canManageExits",
  "canManageDocuments",
  "canManageInterviews",
] as const;

export default async function OperationsPage() {
  const actor = await requireCollaborationActor();
  if (
    !actor.isAdministrator &&
    !operationalPermissions.some((permission) => actor.permissions[permission])
  )
    redirect("/");
  const data = await getOperationsDashboard();
  const canPeople =
    actor.isAdministrator ||
    actor.permissions.canManageEmployees ||
    actor.permissions.canManageAttendance ||
    actor.permissions.canManageLeave;
  const canPayroll =
    actor.isAdministrator || actor.permissions.canManagePayroll;
  const canExit = actor.isAdministrator || actor.permissions.canManageExits;
  const canDocuments =
    actor.isAdministrator ||
    actor.permissions.canManageDocuments ||
    actor.permissions.canVerifyDocuments;
  const canInterviews =
    actor.isAdministrator || actor.permissions.canManageInterviews;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            People operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            HR, payroll, exits, documents and interviews
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            A permission-scoped operational view. Mutations are available
            through the corresponding authenticated operations APIs and are
            audit logged.
          </p>
        </div>
        <Link
          href="/api/admin/operations/leave"
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          Export current view
        </Link>
      </header>

      <section
        aria-label="Operations summary"
        className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4"
      >
        {canPeople ? (
          <Metric
            icon={UsersRound}
            label="Active workforce"
            value={data.metrics.employees}
            detail={`${data.metrics.attendanceToday} attendance records today`}
          />
        ) : null}
        {canPeople ? (
          <Metric
            icon={ClipboardCheck}
            label="Leave approvals"
            value={data.metrics.pendingLeave}
            detail="Requests awaiting a decision"
          />
        ) : null}
        {canPayroll ? (
          <Metric
            icon={CircleDollarSign}
            label="Open payroll runs"
            value={data.metrics.openPayroll}
            detail="Draft through approved"
          />
        ) : null}
        {canExit ? (
          <Metric
            icon={LogOut}
            label="Active exits"
            value={data.metrics.activeExits}
            detail={`${data.metrics.assignedAssets} assets currently assigned`}
          />
        ) : null}
        {canDocuments ? (
          <Metric
            icon={FileCheck2}
            label="Valid documents"
            value={data.metrics.validDocuments}
            detail="Controlled, independently verifiable"
          />
        ) : null}
        {canInterviews ? (
          <Metric
            icon={CalendarClock}
            label="Upcoming interviews"
            value={data.metrics.upcomingInterviews}
            detail="Scheduled or confirmed"
          />
        ) : null}
      </section>

      {actor.isAdministrator ||
      canPeople ||
      canPayroll ||
      canExit ||
      actor.permissions.canManageDocuments ? (
        <OperationsActionPanel
          employees={data.actionEmployees}
          permissions={{
            attendance:
              actor.isAdministrator || actor.permissions.canManageAttendance,
            leave: actor.isAdministrator || actor.permissions.canManageLeave,
            payroll: canPayroll,
            settlement: canPayroll,
            exit: canExit,
            documents:
              actor.isAdministrator || actor.permissions.canManageDocuments,
          }}
        />
      ) : null}

      {canPeople ? (
        <section aria-labelledby="leave-heading">
          <SectionHeading
            id="leave-heading"
            title="Leave approvals"
            href="/api/admin/operations/leave"
          />
          <ResponsiveTable
            headers={["Employee", "Dates", "Type", "Days", "Status"]}
            empty="No leave requests found."
          >
            {data.leaveRequests.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <Cell strong>
                  {item.employee.user.name}
                  <small>{item.employee.employeeCode}</small>
                </Cell>
                <Cell>
                  {formatDate(item.startsAt)} – {formatDate(item.endsAt)}
                </Cell>
                <Cell>{humanize(item.leaveType)}</Cell>
                <Cell>{item.days}</Cell>
                <Cell>
                  <Status value={item.status} />
                </Cell>
              </tr>
            ))}
          </ResponsiveTable>
          <MobileRecords empty="No leave requests found.">
            {data.leaveRequests.map((item) => (
              <MobileRecord
                key={item.id}
                title={item.employee.user.name}
                meta={`${formatDate(item.startsAt)} – ${formatDate(item.endsAt)}`}
                details={`${humanize(item.leaveType)} · ${item.days} days`}
                status={item.status}
              />
            ))}
          </MobileRecords>
        </section>
      ) : null}

      {canPayroll ? (
        <section aria-labelledby="payroll-heading">
          <SectionHeading
            id="payroll-heading"
            title="Payroll runs"
            href="/api/admin/operations/payroll"
          />
          <ResponsiveTable
            headers={["Run", "Period", "Pay date", "Net payroll", "Status"]}
            empty="No payroll runs found."
          >
            {data.payrollRuns.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <Cell strong>{item.code}</Cell>
                <Cell>
                  {formatDate(item.periodStart)} – {formatDate(item.periodEnd)}
                </Cell>
                <Cell>{formatDate(item.payDate)}</Cell>
                <Cell>{formatMoney(item.totalNet, item.currency)}</Cell>
                <Cell>
                  <Status value={item.status} />
                </Cell>
              </tr>
            ))}
          </ResponsiveTable>
          <MobileRecords empty="No payroll runs found.">
            {data.payrollRuns.map((item) => (
              <MobileRecord
                key={item.id}
                title={item.code}
                meta={`${formatDate(item.periodStart)} – ${formatDate(item.periodEnd)}`}
                details={`${formatMoney(item.totalNet, item.currency)} · pay ${formatDate(item.payDate)}`}
                status={item.status}
              />
            ))}
          </MobileRecords>
        </section>
      ) : null}

      {canExit ? (
        <section aria-labelledby="exit-heading">
          <SectionHeading
            id="exit-heading"
            title="Exit clearance"
            href="/api/admin/operations/resignation"
          />
          <ResponsiveTable
            headers={[
              "Employee",
              "Exit date",
              "Exit type",
              "Checklist",
              "Department",
            ]}
            empty="No active exit records found."
          >
            {data.exitRecords.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <Cell strong>
                  {item.employee.user.name}
                  <small>{item.employee.employeeCode}</small>
                </Cell>
                <Cell>{formatDate(item.targetExitDate)}</Cell>
                <Cell>{humanize(item.type)}</Cell>
                <Cell>
                  <Status value={item.status} />
                </Cell>
                <Cell>{item.employee.department?.name ?? "—"}</Cell>
              </tr>
            ))}
          </ResponsiveTable>
          <MobileRecords empty="No active exit records found.">
            {data.exitRecords.map((item) => (
              <MobileRecord
                key={item.id}
                title={item.employee.user.name}
                meta={`${humanize(item.type)} · ${formatDate(item.targetExitDate)}`}
                details={item.employee.department?.name ?? "No department"}
                status={item.status}
              />
            ))}
          </MobileRecords>
        </section>
      ) : null}

      {canInterviews ? (
        <section aria-labelledby="interviews-heading">
          <SectionHeading
            id="interviews-heading"
            title="Interview schedule"
            href="/api/admin/operations/interview"
          />
          <ResponsiveTable
            headers={["Candidate", "Role", "Round", "Schedule", "Feedback"]}
            empty="No interviews scheduled."
          >
            {data.interviews.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <Cell strong>
                  {item.application.fullName}
                  <small>{item.application.email}</small>
                </Cell>
                <Cell>{item.job.title}</Cell>
                <Cell>
                  {item.sequence}. {item.name}
                </Cell>
                <Cell>
                  {formatDateTime(item.scheduledStart)}
                  <small>{item.timezone}</small>
                </Cell>
                <Cell>{item._count.feedback} submitted</Cell>
              </tr>
            ))}
          </ResponsiveTable>
          <MobileRecords empty="No interviews scheduled.">
            {data.interviews.map((item) => (
              <MobileRecord
                key={item.id}
                title={item.application.fullName}
                meta={`${item.job.title} · ${item.name}`}
                details={`${formatDateTime(item.scheduledStart)} · ${item._count.feedback} feedback`}
                status={item.status}
              />
            ))}
          </MobileRecords>
        </section>
      ) : null}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof PackageCheck;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Icon className="size-4 text-emerald-700" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  href,
}: {
  id: string;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="text-base font-semibold text-slate-950">
        {title}
      </h2>
      <Link
        href={href}
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        Open API view
      </Link>
    </div>
  );
}

function ResponsiveTable({
  headers,
  empty,
  children,
}: {
  headers: string[];
  empty: string;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!hasRows ? (
        <p className="p-8 text-center text-sm text-slate-500">{empty}</p>
      ) : null}
    </div>
  );
}

function MobileRecords({
  empty,
  children,
}: {
  empty: string;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className="space-y-2 md:hidden">
      {children}
      {!hasRows ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {empty}
        </p>
      ) : null}
    </div>
  );
}

function MobileRecord({
  title,
  meta,
  details,
  status,
}: {
  title: string;
  meta: string;
  details: string;
  status: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{meta}</p>
        </div>
        <Status value={status} />
      </div>
      <p className="mt-3 text-sm text-slate-700">{details}</p>
    </article>
  );
}

function Cell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 align-top ${strong ? "font-semibold text-slate-950" : "text-slate-700"}`}
    >
      {children}
    </td>
  );
}

function Status({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {humanize(value)}
    </span>
  );
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}
function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    value,
  );
}
function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
