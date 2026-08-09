"use client";

import { Save, ShieldMinus, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  defaultHrPermissions,
  permissionKeys,
  type HrGrantInput,
} from "@/modules/people/schema";

type PermissionKey = (typeof permissionKeys)[number];
type Permissions = HrGrantInput["permissions"];
type Job = { id: string; title: string; company: string };
type Hr = {
  id: string;
  name: string;
  email: string;
  assignedJobs: string[];
  permissions: Permissions | null;
};
type Candidate = { id: string; name: string; email: string; role: string };

const labels: Record<PermissionKey, string> = {
  canGenerateCertificate: "Generate certificates",
  canGenerateOfferLetter: "Generate offers",
  canCreateJob: "Create jobs",
  canManageJobs: "Manage jobs",
  canViewApplicants: "View applicants",
  canManageReviews: "Manage reviews",
  canManageEmployees: "Manage employees",
  canManageRecommendations: "Manage referrals",
  canManageCandidateCollaboration: "Manage candidate collaboration",
  canManageCommunications: "Manage communications",
  canAccessDashboard: "Access dashboard",
  canManageInterviews: "Manage interviews",
  canManageAttendance: "Manage attendance",
  canManageLeave: "Manage leave",
  canManagePayroll: "Manage payroll",
  canManageExits: "Manage exits",
  canManageDocuments: "Manage documents",
  canVerifyDocuments: "Verify documents",
  canManagePrivacy: "Manage privacy requests",
  canManageIntegrations: "Manage integrations",
  canViewReports: "View reports",
};

export function HrAccessManager({
  initialHrs,
  jobs,
  candidates,
}: {
  initialHrs: Hr[];
  jobs: Job[];
  candidates: Candidate[];
}) {
  const [hrs, setHrs] = useState(initialHrs);
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function request(url: string, method: string, body?: object) {
    setBusy(url);
    setMessage(null);
    const response = await fetch(
      url,
      body
        ? {
            method,
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        : { method },
    );
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      hr?: Hr;
    } | null;
    setBusy(null);
    if (!response.ok) {
      setMessage(payload?.message ?? "Unable to update HR access");
      return null;
    }
    return payload;
  }

  function updateHr(id: string, patch: Partial<Hr>) {
    setHrs((current) =>
      current.map((hr) => (hr.id === id ? { ...hr, ...patch } : hr)),
    );
  }

  async function grant() {
    const payload = await request("/api/admin/hr", "POST", {
      userId: candidateId,
      permissions: defaultHrPermissions,
      assignedJobs: jobs.map((job) => job.id),
    });
    if (payload?.hr) {
      setHrs((current) => [...current, payload.hr!]);
      setCandidateId("");
      setMessage(
        "HR access granted. The employee can open the HR workspace immediately.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p
          className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Grant HR access</h2>
        <p className="mt-1 text-sm text-slate-600">
          New HR staff receive recruitment permissions and all active jobs by
          default. Employee administration remains opt-in.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className="h-11 min-w-72 rounded-xl border bg-white px-3"
            value={candidateId}
            onChange={(event) => setCandidateId(event.target.value)}
          >
            <option value="">Select a person</option>
            {candidates
              .filter((candidate) => !hrs.some((hr) => hr.id === candidate.id))
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} · {candidate.email}
                </option>
              ))}
          </select>
          <Button
            type="button"
            disabled={!candidateId || busy !== null}
            onClick={() => void grant()}
          >
            <UserPlus />
            Grant access
          </Button>
        </div>
      </section>

      {hrs.map((hr) => {
        const permissions = hr.permissions ?? { ...defaultHrPermissions };
        return (
          <section
            key={hr.id}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{hr.name}</h2>
                <p className="text-sm text-slate-500">{hr.email}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                onClick={async () => {
                  const result = await request(
                    `/api/admin/hr/${hr.id}`,
                    "DELETE",
                  );
                  if (result !== null)
                    setHrs((current) =>
                      current.filter((item) => item.id !== hr.id),
                    );
                }}
              >
                <ShieldMinus />
                Revoke
              </Button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <fieldset>
                <legend className="font-bold">Permissions</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {permissionKeys.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        onChange={(event) =>
                          updateHr(hr.id, {
                            permissions: {
                              ...permissions,
                              [key]: event.target.checked,
                            },
                          })
                        }
                      />
                      {labels[key]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-bold">Assigned jobs</legend>
                <div className="mt-3 max-h-64 space-y-2 overflow-auto rounded-xl border p-3">
                  {jobs.map((job) => (
                    <label
                      key={job.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={hr.assignedJobs.includes(job.id)}
                        onChange={(event) =>
                          updateHr(hr.id, {
                            assignedJobs: event.target.checked
                              ? [...hr.assignedJobs, job.id]
                              : hr.assignedJobs.filter((id) => id !== job.id),
                          })
                        }
                      />
                      {job.title} · {job.company}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  const current = hrs.find((item) => item.id === hr.id) ?? hr;
                  const result = await request(
                    `/api/admin/hr/${hr.id}`,
                    "PATCH",
                    {
                      permissions: current.permissions ?? defaultHrPermissions,
                      assignedJobs: current.assignedJobs,
                    },
                  );
                  if (result) setMessage("HR access saved");
                }}
              >
                <Save />
                Save access
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
