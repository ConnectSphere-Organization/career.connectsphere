"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  contractSubmissionSchema,
  type ContractDraftInput,
  type ContractSubmissionInput,
} from "@/modules/contracts/schema";

type Defaults = Pick<
  ContractSubmissionInput,
  | "position"
  | "department"
  | "salary"
  | "startDate"
  | "joiningLocation"
  | "workType"
  | "reportingManager"
>;
const steps = [
  "Personal",
  "Banking",
  "Employment",
  "Legal & documents",
] as const;

export function ContractOnboardingForm({
  token,
  defaults,
  draft,
  draftDocuments,
}: {
  token: string;
  defaults: Defaults;
  draft: ContractDraftInput | null;
  draftDocuments: Array<{
    fileName: string | null;
    documentType: string | null;
  }>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(draft?.currentStep ?? 0);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      phone: "",
      dateOfBirth: "",
      nationality: "Indian",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      emergencyEmail: "",
      idType: "AADHAR" as ContractSubmissionInput["idType"],
      idNumber: "",
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      accountType: "SAVINGS" as ContractSubmissionInput["accountType"],
      branch: "",
      ...defaults,
      ...draft,
      termsAccepted: draft?.termsAccepted ?? false,
      privacyPolicyAccepted: draft?.privacyPolicyAccepted ?? false,
    },
    onSubmit: async ({ value }) => {
      const parsed = contractSubmissionSchema.safeParse(value);
      if (!parsed.success)
        return setMessage(
          parsed.error.issues[0]?.message ?? "Review the onboarding details",
        );
      const formElement = document.querySelector<HTMLFormElement>(
        "#contract-onboarding-form",
      );
      if (!formElement) return;
      setSubmitting(true);
      setMessage(null);
      const fileInputs = Array.from(
        formElement.querySelectorAll<HTMLInputElement>('input[type="file"]'),
      ).filter((input) => input.files && input.files.length > 0);
      if (fileInputs.length > 0) {
        const saved = await saveDocuments();
        if (!saved) {
          setSubmitting(false);
          return;
        }
      }
      const response = await fetch(
        `/api/contracts/onboarding/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ payload: JSON.stringify(parsed.data) }),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      const resultMessage =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;
      setMessage(
        resultMessage ??
          (response.ok
            ? "Onboarding submitted securely for HR review."
            : "Unable to submit onboarding"),
      );
      setSubmitting(false);
      if (response.ok) router.push("/my-applications?submitted=1");
    },
  });

  async function moveToStep(nextStep: number) {
    setMessage("Saving draft…");
    const response = await fetch(
      `/api/contracts/onboarding/${encodeURIComponent(token)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form.state.values, currentStep: nextStep }),
      },
    );
    if (!response.ok) {
      const result: unknown = await response.json().catch(() => null);
      const error =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "Unable to save this step. Review the highlighted information and try again.";
      setMessage(error);
      return;
    }
    setMessage("Draft saved securely.");
    setStep(nextStep);
  }

  async function saveDocuments() {
    const formElement = document.querySelector<HTMLFormElement>(
      "#contract-onboarding-form",
    );
    if (!formElement) return;
    const body = new FormData();
    const identity = formElement.elements.namedItem("identityDocument");
    const supporting = formElement.elements.namedItem("document:0");
    const supportingType = formElement.elements.namedItem("documentType:0");
    if (identity instanceof HTMLInputElement && identity.files?.[0])
      body.set("identityDocument", identity.files[0]);
    if (supporting instanceof HTMLInputElement && supporting.files?.[0])
      body.set("supportingDocument", supporting.files[0]);
    if (supportingType instanceof HTMLSelectElement)
      body.set("supportingDocumentType", supportingType.value);
    if (![...body.keys()].length) return true;
    setMessage("Uploading documents securely…");
    const response = await fetch(
      `/api/contracts/onboarding/${encodeURIComponent(token)}`,
      { method: "PATCH", body },
    );
    const result: unknown = await response.json().catch(() => null);
    const responseMessage =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : null;
    setMessage(
      response.ok
        ? "Documents saved securely."
        : (responseMessage ?? "Unable to save documents"),
    );
    return response.ok;
  }

  if (step === 4)
    return (
      <div
        className="rounded-2xl bg-emerald-50 p-6 font-bold text-emerald-800"
        role="status"
      >
        {message}
      </div>
    );
  const input = (
    name: keyof ContractSubmissionInput,
    label: string,
    type = "text",
    readOnly = false,
  ) => (
    <form.Field name={name}>
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            type={type}
            readOnly={readOnly}
            value={String(field.state.value)}
            onBlur={field.handleBlur}
            onChange={(event) =>
              field.handleChange(event.target.value as never)
            }
          />
        </div>
      )}
    </form.Field>
  );
  const idTypeSelect = (
    <form.Field name="idType">
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor="idType">Identity type</Label>
          <select
            id="idType"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            value={field.state.value}
            onChange={(event) =>
              field.handleChange(
                event.target.value as ContractSubmissionInput["idType"],
              )
            }
          >
            <option value="AADHAR">Aadhar</option>
            <option value="PAN">PAN</option>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVING_LICENSE">Driving licence</option>
            <option value="VOTER_ID">Voter ID</option>
          </select>
        </div>
      )}
    </form.Field>
  );
  const accountTypeSelect = (
    <form.Field name="accountType">
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor="accountType">Account type</Label>
          <select
            id="accountType"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            value={field.state.value}
            onChange={(event) =>
              field.handleChange(
                event.target.value as ContractSubmissionInput["accountType"],
              )
            }
          >
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
        </div>
      )}
    </form.Field>
  );
  const workTypeSelect = (
    <form.Field name="workType">
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor="workType">Work type</Label>
          <select
            id="workType"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            value={field.state.value}
            disabled
          >
            <option value="REMOTE">Remote</option>
            <option value="ON_SITE">On-site</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
      )}
    </form.Field>
  );

  return (
    <form
      id="contract-onboarding-form"
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-xl px-3 py-2 text-center text-xs font-bold ${index === step ? "bg-emerald-700 text-white" : index < step ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {message ? (
        <p className="rounded-xl bg-rose-50 p-3 text-rose-700" role="alert">
          {message}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        {step === 0 ? (
          <>
            {input("phone", "Phone", "tel")}
            {input("dateOfBirth", "Date of birth", "date")}
            {input("nationality", "Nationality")}
            {input("street", "Street address")}
            {input("city", "City")}
            {input("state", "State")}
            {input("zipCode", "Postal code")}
            {input("country", "Country")}
            {input("emergencyName", "Emergency contact")}
            {input("emergencyRelationship", "Relationship")}
            {input("emergencyPhone", "Emergency phone", "tel")}
            {input("emergencyEmail", "Emergency email", "email")}
            {idTypeSelect}
            {input("idNumber", "Identity number")}
          </>
        ) : null}
        {step === 1 ? (
          <>
            {input("accountHolderName", "Account holder")}
            {input("accountNumber", "Account number")}
            {input("bankName", "Bank name")}
            {input("ifscCode", "IFSC / routing code")}
            {accountTypeSelect}
            {input("branch", "Branch")}
          </>
        ) : null}
        {step === 2 ? (
          <>
            {input("position", "Position", "text", true)}
            {input("department", "Department", "text", true)}
            {input("salary", "Compensation", "text", true)}
            {input("startDate", "Start date", "date", true)}
            {input("joiningLocation", "Joining location", "text", true)}
            {workTypeSelect}
            {input("reportingManager", "Reporting manager", "text", true)}
          </>
        ) : null}
        {step === 3 ? (
          <div className="space-y-5 sm:col-span-2">
            {draftDocuments.length ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-bold">Previously saved documents</p>
                {draftDocuments.map((document, index) => (
                  <p key={`${document.fileName}-${index}`}>
                    {document.fileName} (
                    {document.documentType?.replaceAll("_", " ")})
                  </p>
                ))}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="identityDocument">
                Identity document (PDF, JPEG, PNG; max 8 MB)
              </Label>
              <Input
                id="identityDocument"
                name="identityDocument"
                type="file"
                required={draftDocuments.every(
                  (item) => item.documentType !== "ID_PROOF",
                )}
                accept="application/pdf,image/jpeg,image/png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document:0">Supporting document (optional)</Label>
              <select
                name="documentType:0"
                className="mb-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
              >
                <option value="ADDRESS_PROOF">Address proof</option>
                <option value="EDUCATIONAL_CERTIFICATE">
                  Educational certificate
                </option>
                <option value="EXPERIENCE_LETTER">Experience letter</option>
                <option value="OTHER">Other</option>
              </select>
              <Input
                id="document:0"
                name="document:0"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveDocuments()}
            >
              Save selected documents
            </Button>
            <form.Field name="termsAccepted">
              {(field) => (
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                  />
                  <span>
                    I confirm that the provided information is correct and I
                    accept this offer.
                  </span>
                </label>
              )}
            </form.Field>
            <form.Field name="privacyPolicyAccepted">
              {(field) => (
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                  />
                  <span>
                    I acknowledge the privacy policy and secure processing of
                    onboarding data.
                  </span>
                </label>
              )}
            </form.Field>
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Bank account and identity numbers are encrypted before storage. HR
              views remain masked; no reveal endpoint is provided.
            </p>
          </div>
        ) : null}
      </div>
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || submitting}
          onClick={() => void moveToStep(Math.max(0, step - 1))}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={() => void moveToStep(Math.min(3, step + 1))}
          >
            Save & continue
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Encrypting and submitting…"
              : "Submit onboarding form & accept offer"}
          </Button>
        )}
      </div>
    </form>
  );
}
