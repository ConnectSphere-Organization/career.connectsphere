"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type RowResult = {
  row: number;
  success: boolean;
  reference?: string | null;
  error?: string;
};
type Report = {
  total: number;
  succeeded: number;
  failed: number;
  results: RowResult[];
};

export function BulkCertificateImport() {
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage(null);
    setReport(null);
    const response = await fetch("/api/recruitment/certificates/bulk", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as Report & { message?: string };
    setBusy(false);
    if (!response.ok)
      return setMessage(payload.message ?? "Unable to import certificates");
    setReport(payload);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5">
        <p className="font-bold text-slate-950">Upload certificate CSV</p>
        <p className="mt-1 text-sm text-slate-600">
          Issue up to 499 certificates per file with row-level validation.
        </p>
        <Link
          className="mt-3 inline-block font-bold text-emerald-700"
          href="/api/recruitment/certificates/bulk/sample"
        >
          Download sample CSV
        </Link>
        <form
          action={submit}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <input
            aria-label="Certificate CSV"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-2"
          />
          <Button disabled={busy}>
            {busy ? "Importing…" : "Import certificates"}
          </Button>
        </form>
      </div>
      {message ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">
          {message}
        </p>
      ) : null}
      {report ? (
        <div>
          <p className="font-bold">
            {report.succeeded} succeeded · {report.failed} failed ·{" "}
            {report.total} total
          </p>
          <div className="mt-3 max-h-64 overflow-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((item) => (
                  <tr key={item.row} className="border-t">
                    <td className="p-3">{item.row}</td>
                    <td
                      className={`p-3 ${item.success ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {item.success
                        ? `Issued ${item.reference ?? "certificate"}`
                        : item.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
