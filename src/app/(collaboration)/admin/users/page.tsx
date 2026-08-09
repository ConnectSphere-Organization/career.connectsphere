import Link from "next/link";

import { requireCollaboration } from "@/lib/auth/authorization";
import { PeopleManager } from "@/modules/people/components/people-manager";
import { listPeople } from "@/modules/people/server/people";

export default async function UsersPage() {
  const actor = await requireCollaboration("canManageEmployees");
  const result = await listPeople({ view: "users" });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">People</p>
          <h1 className="mt-3 text-4xl font-extrabold">Users</h1>
        </div>
        <Link
          href="/admin/employees"
          className="rounded-xl border bg-white px-4 py-2 font-bold"
        >
          View employees
        </Link>
      </div>
      <p className="mt-3 mb-8 text-slate-600">
        Basic account status and role lifecycle controls. Role changes require
        super-admin access.
      </p>
      <PeopleManager
        people={result.people}
        canChangeRoles={actor.isSuperAdmin}
      />
    </>
  );
}
