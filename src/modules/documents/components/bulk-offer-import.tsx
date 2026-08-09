"use client";

import { useState } from "react";
import Link from "next/link";

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

export function BulkOfferImport() {
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage(null);
    setReport(null);
    const response = await fetch("/api/recruitment/offers/bulk", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as Report & { message?: string };
    setBusy(false);
    if (!response.ok)
      return setMessage(payload.message ?? "Unable to import offers");
    setReport(payload);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="font-bold text-emerald-700"
          href="/api/recruitment/offers/bulk/sample"
        >
          Download sample CSV
        </Link>
        <form action={submit} className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Offer CSV"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="rounded-lg border p-2"
          />
          <Button disabled={busy}>
            {busy ? "Importing…" : "Import offers"}
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
                        ? `Issued ${item.reference ?? "offer"}`
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
