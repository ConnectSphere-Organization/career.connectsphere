"use client";

import { useForm } from "@tanstack/react-form";
import {
  CheckCircle2,
  LoaderCircle,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationResult = {
  valid: boolean;
  kind: "certificate" | "offer" | "document";
  record?: Record<string, string | null>;
};

export function VerificationForm({
  kind,
  initialId = "",
}: {
  kind: "certificate" | "offer" | "document";
  initialId?: string;
}) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { id: initialId },
    onSubmit: async ({ value }) => {
      const id = value.id.trim();
      if (id.length < 4) {
        setError("Enter at least four characters from the document identifier");
        return;
      }
      setError(null);
      setResult(null);
      const response = await fetch(
        `/api/verify/${kind}/${encodeURIComponent(id)}`,
      );
      const body = (await response.json()) as VerificationResult & {
        message?: string;
      };
      if (!response.ok) {
        setError(body.message ?? "Document not found");
        return;
      }
      setResult(body);
    },
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="id">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="document-id">
                {kind === "certificate"
                  ? "Certificate"
                  : kind === "offer"
                    ? "Offer letter"
                    : "Document verification"}{" "}
                identifier
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="document-id"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter the unique ID"
                />
                <form.Subscribe selector={(state) => [state.isSubmitting]}>
                  {([submitting]) => (
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <LoaderCircle
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Search aria-hidden="true" />
                      )}{" "}
                      Verify
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          )}
        </form.Field>
      </form>
      {error ? (
        <div className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}
      {result?.valid && result.record ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-emerald-700">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-emerald-950">
                Verified ConnectSphere document
              </p>
              <p className="text-sm text-emerald-800">
                The identifier matches an official record.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 border-t border-emerald-200 pt-5 sm:grid-cols-2">
            {Object.entries(result.record)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-bold tracking-wide text-emerald-700 uppercase">
                    {key.replaceAll(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" />{" "}
          Verification results expose only approved public fields.
        </div>
      )}
    </div>
  );
}
