"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  position: string | null;
  positionLevel: string;
  employeeId: string | null;
  createdAt: string | Date;
};
type ApiMessage = { message?: string };

export function PeopleManager({
  people,
  canChangeRoles,
}: {
  people: Person[];
  canChangeRoles: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function patch(id: string, body: object) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(
      `/api/admin/people/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setBusyId(null);
    if (!response.ok) {
      const payload = (await response.json()) as ApiMessage;
      return setMessage(payload.message ?? "Unable to update account");
    }
    window.location.reload();
  }

  return (
    <div>
      {message ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-800"
        >
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-4xl text-left text-sm">
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-4">Person</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Employment</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((person) => (
              <tr key={person.id}>
                <td className="px-5 py-4">
                  <strong>{person.name}</strong>
                  <p className="text-slate-500">{person.email}</p>
                </td>
                <td className="px-5 py-4">
                  {canChangeRoles ? (
                    <select
                      defaultValue={person.role}
                      disabled={busyId === person.id}
                      onChange={(event) =>
                        patch(person.id, {
                          operation: "role",
                          role: event.target.value,
                        })
                      }
                      className="rounded-md border bg-white px-2 py-2"
                    >
                      <option value="USER">User</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="RECRUITER">Recruiter</option>
                      <option value="MANAGER">Manager</option>
                      <option value="HR">HR</option>
                      <option value="FINANCE">Finance</option>
                      <option value="PAYROLL_ADMIN">Payroll admin</option>
                      <option value="VERIFIER">Verifier</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super-admin</option>
                    </select>
                  ) : (
                    person.role
                  )}
                </td>
                <td className="px-5 py-4">
                  <select
                    defaultValue={person.status}
                    disabled={busyId === person.id}
                    onChange={(event) =>
                      patch(person.id, {
                        operation: "profile",
                        status: event.target.value,
                        department: person.department,
                        position: person.position,
                        positionLevel: person.positionLevel,
                      })
                    }
                    className="rounded-md border bg-white px-2 py-2"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="FORMER">Former</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  <p>{person.position ?? "—"}</p>
                  <p className="text-slate-500">
                    {person.department ?? "No department"}
                    {person.employeeId ? ` · ${person.employeeId}` : ""}
                  </p>
                </td>
                <td className="px-5 py-4">
                  {person.role !== "USER" && person.status !== "FORMER" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busyId === person.id}
                      onClick={() => {
                        const reason = window.prompt("Termination reason");
                        if (reason?.trim())
                          void patch(person.id, {
                            operation: "terminate",
                            reason,
                          });
                      }}
                    >
                      Terminate
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {people.length === 0 ? (
        <p className="p-10 text-center text-slate-500">No matching accounts.</p>
      ) : null}
    </div>
  );
}
