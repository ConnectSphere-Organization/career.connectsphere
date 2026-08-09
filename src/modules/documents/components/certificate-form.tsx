"use client";

import { useForm } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  certificateInputSchema,
  type CertificateInput,
} from "@/modules/documents/schema";

const defaults: CertificateInput = {
  jobId: "",
  name: "",
  recipientEmail: "",
  domain: "",
  jobrole: "",
  fromDate: "",
  toDate: "",
  issuedBy: "ConnectSphere",
};

export function CertificateForm({
  initialValues = {},
  jobs = [],
}: {
  initialValues?: Partial<CertificateInput>;
  jobs?: Array<{ id: string; title: string; company: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { ...defaults, ...initialValues },
    onSubmit: async ({ value, formApi }) => {
      setError(null);
      const parsed = certificateInputSchema.safeParse(value);
      if (!parsed.success)
        return setError(
          parsed.error.issues[0]?.message ?? "Review the certificate details",
        );
      const response = await fetch("/api/recruitment/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: unknown = await response.json().catch(() => null);
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;
      if (!response.ok)
        return setError(message ?? "Unable to issue certificate");
      formApi.reset();
      router.refresh();
    },
  });
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {error ? (
        <p
          className="rounded-xl bg-rose-50 p-3 font-semibold text-rose-700 md:col-span-2"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form.Field name="jobId">
        {(field) => (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="certificate-job">Authorized job</Label>
            <select
              id="certificate-job"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              required
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
          </div>
        )}
      </form.Field>
      <form.Field name="name">
        {(field) => <Field label="Recipient name" field={field} />}
      </form.Field>
      <form.Field name="recipientEmail">
        {(field) => (
          <Field label="Recipient email (private)" field={field} type="email" />
        )}
      </form.Field>
      <form.Field name="domain">
        {(field) => <Field label="Domain" field={field} />}
      </form.Field>
      <form.Field name="jobrole">
        {(field) => <Field label="Job role" field={field} />}
      </form.Field>
      <form.Field name="fromDate">
        {(field) => <Field label="From" field={field} type="date" />}
      </form.Field>
      <form.Field name="toDate">
        {(field) => <Field label="To" field={field} type="date" />}
      </form.Field>
      <form.Field name="issuedBy">
        {(field) => <Field label="Issued by" field={field} />}
      </form.Field>
      <div className="flex items-end">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(pending) => (
            <Button className="w-full" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null}Issue
              certificate
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

type FieldValue = {
  name: string;
  state: { value: string };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};
function Field({
  label,
  field,
  type = "text",
}: {
  label: string;
  field: FieldValue;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </div>
  );
}
