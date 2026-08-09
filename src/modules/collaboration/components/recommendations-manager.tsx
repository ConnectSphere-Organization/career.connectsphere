"use client";

import {
  BriefcaseBusiness,
  MailCheck,
  Send,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Candidate = {
  id: string;
  fullName: string;
  status: string;
  job: { id: string; title: string; company: string };
};
type Job = {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  department: string | null;
  location: string | null;
};
type Recommendation = {
  id: string;
  recommendedUserName: string;
  recommendedUserEmail: string;
  candidatePhone: string | null;
  relationship: string | null;
  recommendationMessage: string | null;
  status: string;
  adminNotes: string | null;
  consentConfirmed: boolean;
  invitationSentAt: string | Date | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  reviewedAt: string | Date | null;
  job: { id: string; slug: string | null; title: string; company: string };
  application: { id: string; slug: string | null; status: string } | null;
};
type ApiMessage = { message?: string };
type Mode = "NEW_CANDIDATE" | "EXISTING_APPLICATION";

export function RecommendationsManager({
  candidates,
  recommendations,
  jobs,
}: {
  candidates: Candidate[];
  recommendations: Recommendation[];
  jobs: Job[];
}) {
  const [mode, setMode] = useState<Mode>("NEW_CANDIDATE");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(formData: FormData) {
    setBusy(true);
    setMessage(null);
    const body =
      mode === "NEW_CANDIDATE"
        ? {
            kind: mode,
            jobId: formData.get("jobId"),
            candidateName: formData.get("candidateName"),
            candidateEmail: formData.get("candidateEmail"),
            candidatePhone: formData.get("candidatePhone"),
            relationship: formData.get("relationship"),
            message: formData.get("message"),
            consentConfirmed: formData.get("consentConfirmed") === "on",
          }
        : {
            kind: mode,
            applicationId: formData.get("applicationId"),
            relationship: formData.get("relationship"),
            message: formData.get("message"),
            consentConfirmed: formData.get("consentConfirmed") === "on",
          };
    const response = await fetch("/api/employee/recommendations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiMessage;
    setBusy(false);
    if (!response.ok)
      return setMessage(payload.message ?? "Unable to submit referral");
    window.location.reload();
  }

  async function remove(id: string) {
    if (!window.confirm("Withdraw this pending referral?")) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch(
      `/api/employee/recommendations/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as ApiMessage;
      return setMessage(payload.message ?? "Unable to withdraw referral");
    }
    window.location.reload();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[24rem_1fr]">
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-8">
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("NEW_CANDIDATE")}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "NEW_CANDIDATE" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
          >
            New candidate
          </button>
          <button
            type="button"
            onClick={() => setMode("EXISTING_APPLICATION")}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "EXISTING_APPLICATION" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
          >
            Existing applicant
          </button>
        </div>

        <form action={create} className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
              {mode === "NEW_CANDIDATE"
                ? "Introduce someone"
                : "Endorse an application"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">New referral</h2>
          </div>

          {mode === "NEW_CANDIDATE" ? (
            <>
              <Field label="Open job">
                <select
                  name="jobId"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.company}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Candidate name">
                <Input
                  name="candidateName"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </Field>
              <Field label="Candidate email">
                <Input
                  name="candidateEmail"
                  type="email"
                  required
                  maxLength={254}
                />
              </Field>
              <Field label="Candidate phone (optional)">
                <Input name="candidatePhone" type="tel" maxLength={30} />
              </Field>
            </>
          ) : (
            <Field label="Eligible application">
              <select
                name="applicationId"
                required
                defaultValue=""
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
              >
                <option value="" disabled>
                  Select an applicant
                </option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName} — {candidate.job.title} (
                    {candidate.status})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Only active applications without another referral are shown.
              </p>
            </Field>
          )}

          <Field label="How do you know this person?">
            <Input
              name="relationship"
              placeholder="Former colleague, classmate, manager…"
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
          <Field label="Why are they a strong fit?">
            <textarea
              name="message"
              required
              minLength={20}
              maxLength={1500}
              className="min-h-32 w-full rounded-xl border border-slate-200 p-3"
            />
          </Field>
          <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <input
              name="consentConfirmed"
              type="checkbox"
              required
              className="mt-1 size-4"
            />
            <span>
              I confirm the candidate knows I am sharing their details with ConnectSphere
              for recruitment.
            </span>
          </label>
          {message ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
            >
              {message}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={
              busy ||
              (mode === "NEW_CANDIDATE"
                ? jobs.length === 0
                : candidates.length === 0)
            }
          >
            {busy ? (
              "Submitting…"
            ) : (
              <>
                <Send />
                Submit referral
              </>
            )}
          </Button>
        </form>
      </aside>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Your activity
            </p>
            <h2 className="mt-1 text-3xl font-extrabold">Referral tracker</h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
            {recommendations.length} total
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {recommendations.map((item) => (
            <ReferralCard
              key={item.id}
              item={item}
              busy={busy}
              onRemove={remove}
            />
          ))}
          {recommendations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-14 text-center">
              <UserRoundCheck className="mx-auto size-12 text-slate-300" />
              <p className="mt-4 text-lg font-bold">No referrals yet</p>
              <p className="mt-1 text-slate-500">
                Introduce someone you trust to an open ConnectSphere role.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ReferralCard({
  item,
  busy,
  onRemove,
}: {
  item: Recommendation;
  busy: boolean;
  onRemove: (id: string) => Promise<void>;
}) {
  const stages = ["PENDING", "REVIEWED", "SELECTED"];
  const stage =
    item.status === "REJECTED" ? 1 : Math.max(0, stages.indexOf(item.status));
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold">{item.recommendedUserName}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {item.job.title} · {item.job.company}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {item.recommendedUserEmail}
            {item.relationship ? ` · ${item.relationship}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${item.status === "REJECTED" ? "bg-rose-100 text-rose-800" : item.status === "SELECTED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
        >
          {item.status}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {stages.map((label, index) => (
          <div key={label}>
            <div
              className={`h-1.5 rounded-full ${index <= stage && item.status !== "REJECTED" ? "bg-emerald-500" : "bg-slate-200"}`}
            />
            <p className="mt-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              {label === "SELECTED" ? "Decision" : label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 whitespace-pre-wrap text-slate-700">
        {item.recommendationMessage}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatusFact
          icon={item.invitationSentAt ? MailCheck : BriefcaseBusiness}
          label="Candidate"
          value={
            item.application
              ? `Applied · ${item.application.status}`
              : item.invitationSentAt
                ? "Invitation sent · awaiting application"
                : "Existing application linked"
          }
        />
        <StatusFact
          icon={UserRoundCheck}
          label="HR review"
          value={
            item.status === "PENDING"
              ? "Awaiting review"
              : item.status.toLowerCase()
          }
        />
      </div>
      {item.adminNotes ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <strong>HR note:</strong> {item.adminNotes}
        </p>
      ) : null}
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <time>{new Date(item.createdAt).toLocaleDateString()}</time>
        {item.status === "PENDING" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRemove(item.id)}
            className="flex items-center gap-1 font-bold text-rose-700"
          >
            <Trash2 className="size-4" />
            Withdraw
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function StatusFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MailCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div>
        <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
