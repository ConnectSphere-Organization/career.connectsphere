"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Result = { row: number; success: boolean; email?: string; error?: string };
type Report = {
  total: number;
  succeeded: number;
  failed: number;
  results: Result[];
  message?: string;
};

export function EmployeeImport() {
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true);
    setMessage(null);
    setReport(null);
    const response = await fetch("/api/admin/people/bulk", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as Report;
    setBusy(false);
    if (!response.ok) return setMessage(payload.message ?? "Import failed");
    setReport(payload);
  }
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-bold">Bulk employee onboarding</h2>
      <p className="mt-1 text-sm text-slate-600">
        New employees receive expiring password-reset links. Passwords are never
        included in CSV files or responses.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          className="font-bold text-emerald-700"
          href="/api/admin/people/bulk/sample"
        >
          Download sample CSV
        </Link>
        <form action={submit} className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Employee CSV"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="rounded-lg border p-2"
          />
          <Button disabled={busy}>
            {busy ? "Importing…" : "Import employees"}
          </Button>
        </form>
      </div>
      {message ? (
        <p role="alert" className="mt-3 text-rose-700">
          {message}
        </p>
      ) : null}
      {report ? (
        <div className="mt-4">
          <p className="font-bold">
            {report.succeeded} succeeded · {report.failed} failed
          </p>
          <ul className="mt-2 max-h-48 overflow-auto text-sm">
            {report.results.map((result) => (
              <li
                key={result.row}
                className={
                  result.success ? "text-emerald-700" : "text-rose-700"
                }
              >
                Row {result.row}:{" "}
                {result.success ? `${result.email} onboarded` : result.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
