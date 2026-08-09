import Link from "next/link";

import { requireCollaboration } from "@/lib/auth/authorization";
import { PeopleManager } from "@/modules/people/components/people-manager";
import { EmployeeImport } from "@/modules/people/components/employee-import";
import { listPeople } from "@/modules/people/server/people";

export default async function EmployeesPage() {
  const actor = await requireCollaboration("canManageEmployees");
  const result = await listPeople({ view: "employees" });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">People</p>
          <h1 className="mt-3 text-4xl font-extrabold">Employees</h1>
        </div>
        <Link
          href="/admin/users"
          className="rounded-xl border bg-white px-4 py-2 font-bold"
        >
          View users
        </Link>
      </div>
      <p className="mt-3 mb-8 text-slate-600">
        Manage employment status and terminate accounts with an audited reason.
      </p>
      <div className="mb-8">
        <EmployeeImport />
      </div>
      <PeopleManager
        people={result.people}
        canChangeRoles={actor.isSuperAdmin}
      />
    </>
  );
}
