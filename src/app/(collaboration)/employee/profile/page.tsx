import { requireEmployee } from "@/lib/auth/authorization";
import { getEmployeeProfile } from "@/modules/collaboration/server/recommendations";

export default async function EmployeeProfilePage() {
  const actor = await requireEmployee({ allowFormer: true });
  const profile = await getEmployeeProfile(actor);
  const details = [
    ["Employee ID", profile.employeeId],
    ["Email", profile.email],
    ["Phone", profile.phoneNumber],
    ["Department", profile.department],
    ["Position", profile.position],
    ["Level", profile.positionLevel],
    ["Reporting manager", profile.reportingManager],
    ["Status", profile.status],
    ["Joined", profile.createdAt.toLocaleDateString("en-IN")],
  ];
  return (
    <>
      <p className="section-kicker">Employee</p>
      <h1 className="mt-3 text-4xl font-extrabold">{profile.name}</h1>
      <p className="mt-2 text-slate-600">
        Your employment profile. Contact HR to correct managed details.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-5">
            <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              {label}
            </dt>
            <dd className="mt-2 font-semibold">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
