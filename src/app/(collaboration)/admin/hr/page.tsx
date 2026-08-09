import type { Metadata } from "next";

import { requireSuperAdmin } from "@/lib/auth/authorization";
import { HrAccessManager } from "@/modules/people/components/hr-access-manager";
import { listHrManagement } from "@/modules/people/server/hr";

export const metadata: Metadata = {
  title: "HR access",
  robots: { index: false, follow: false },
};

export default async function HrAccessPage() {
  await requireSuperAdmin();
  const data = await listHrManagement();
  return (
    <>
      <p className="section-kicker">Authorization</p>
      <h1 className="mt-3 text-4xl font-extrabold">
        HR permissions & job scope
      </h1>
      <p className="mt-3 mb-8 max-w-3xl text-slate-600">
        Canonical HR access requires an employee in the HR department.
        Permissions control capabilities; assigned jobs bound non-administrator
        recruitment data.
      </p>
      <HrAccessManager
        initialHrs={data.hrs}
        jobs={data.jobs}
        candidates={data.candidates}
      />
    </>
  );
}
