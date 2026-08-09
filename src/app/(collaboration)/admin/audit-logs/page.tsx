import { requireSuperAdmin } from "@/lib/auth/authorization";
import { listAuditLogs } from "@/modules/collaboration/server/audit";

export default async function AuditLogsPage() {
  await requireSuperAdmin();
  const logs = await listAuditLogs();
  return (
    <>
      <p className="section-kicker">Super-admin</p>
      <h1 className="mt-3 text-4xl font-extrabold">Audit log</h1>
      <p className="mt-3 mb-8 text-slate-600">
        Latest immutable administrative events. Sensitive change payloads are
        not exposed in this view.
      </p>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-4">When</th>
              <th className="px-5 py-4">Actor</th>
              <th className="px-5 py-4">Action</th>
              <th className="px-5 py-4">Resource</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-5 py-4">{log.createdAt.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <strong>{log.actorUser?.name ?? "Deleted user"}</strong>
                  <p className="text-xs text-slate-500">{log.actorRole}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {log.resourceEntity}
                  <p className="font-mono text-xs text-slate-400">
                    {log.resourceId ?? "—"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
