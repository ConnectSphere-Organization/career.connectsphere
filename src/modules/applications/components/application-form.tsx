"use client";

import { useForm } from "@tanstack/react-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recaptchaToken } from "@/lib/security/recaptcha-client";
import {
  applicationFieldsSchema,
  type ApplicationFields,
} from "@/modules/applications/schema";
import type { PublicJobDetail } from "@/modules/jobs/types";

type Candidate = {
  name: string;
  email: string;
  phoneNumber?: string | null | undefined;
};
type Answer = ApplicationFields["questionAnswers"][string];
type StoredDraft = {
  step?: number;
  answers?: Record<string, Answer>;
  values?: Partial<ApplicationFields>;
};

const steps = ["Role", "Contact", "Background", "Questions & review"] as const;
const textareaClass =
  "min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10";

export function ApplicationForm({
  job,
  candidate,
  hasApplied,
  referralId = "",
}: {
  job: PublicJobDetail;
  candidate: Candidate;
  hasApplied: boolean;
  referralId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resume, setResume] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [questionFiles, setQuestionFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftKey = `connectsphere-application-draft:${job.id}`;

  const form = useForm({
    defaultValues: {
      jobIdentifier: job.slug ?? job.id,
      referralId,
      fullName: candidate.name,
      email: candidate.email,
      phone: candidate.phoneNumber?.replace(/[^+\d]/g, "") ?? "",
      experience: "",
      education: "",
      skills: "",
      coverLetter: "",
      questionAnswers: {},
      privacyConsentAccepted: false as true,
      privacyPolicyVersion: "2026-07-14",
    } satisfies ApplicationFields,
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = applicationFieldsSchema.safeParse({
        ...value,
        questionAnswers: answers,
      });
      if (!parsed.success)
        return setError(
          parsed.error.issues[0]?.message ?? "Review the form fields",
        );
      if (!resume) return setError("Resume is required");

      const body = new FormData();
      for (const [key, fieldValue] of Object.entries(parsed.data)) {
        body.set(
          key,
          key === "questionAnswers"
            ? JSON.stringify(fieldValue)
            : String(fieldValue),
        );
      }
      body.set("resume", resume, resume.name);
      body.set("recaptchaToken", await recaptchaToken("application_submit"));
      for (const [questionId, file] of Object.entries(questionFiles))
        body.set(`questionFile:${questionId}`, file, file.name);

      const { response, result } = await uploadApplication(
        body,
        setUploadProgress,
      );
      const message =
        typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
          ? result.message
          : null;
      if (!response.ok)
        return setError(message ?? "Unable to submit application");
      localStorage.removeItem(draftKey);
      await fetch(
        `/api/applications/drafts?jobId=${encodeURIComponent(job.id)}`,
        {
          method: "DELETE",
        },
      ).catch(() => undefined);
      router.push("/my-applications?submitted=1");
      router.refresh();
    },
  });

  useEffect(() => {
    function restore(draft: StoredDraft) {
      if (draft.values) {
        if (typeof draft.values.fullName === "string")
          form.setFieldValue("fullName", draft.values.fullName);
        if (typeof draft.values.email === "string")
          form.setFieldValue("email", draft.values.email);
        if (typeof draft.values.phone === "string")
          form.setFieldValue("phone", draft.values.phone);
        if (typeof draft.values.experience === "string")
          form.setFieldValue("experience", draft.values.experience);
        if (typeof draft.values.education === "string")
          form.setFieldValue("education", draft.values.education);
        if (typeof draft.values.skills === "string")
          form.setFieldValue("skills", draft.values.skills);
        if (typeof draft.values.coverLetter === "string")
          form.setFieldValue("coverLetter", draft.values.coverLetter);
      }
      if (draft.answers) setAnswers(draft.answers);
      if (typeof draft.step === "number")
        setStep(Math.max(0, Math.min(steps.length - 1, draft.step)));
      setDraftRestored(true);
    }
    const raw = localStorage.getItem(draftKey);
    let timer: number | undefined;
    let cancelled = false;
    if (!raw) {
      void fetch("/api/applications/drafts", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then(
          (
            payload: {
              drafts?: Array<{ jobId: string; payload: StoredDraft }>;
            } | null,
          ) => {
            if (cancelled) return;
            const draft = payload?.drafts?.find(
              (item) => item.jobId === job.id,
            );
            if (draft?.payload) restore(draft.payload);
          },
        )
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }
    try {
      const draft = JSON.parse(raw) as StoredDraft;
      timer = window.setTimeout(() => {
        restore(draft);
      }, 0);
    } catch {
      localStorage.removeItem(draftKey);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [draftKey, form, job.id]);

  const setAnswer = (questionId: string, answer: Answer) =>
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  const next = () => {
    setError(null);
    if (
      step === 1 &&
      (!resume ||
        !form.state.values.fullName.trim() ||
        !/^\+?[1-9]\d{6,14}$/.test(form.state.values.phone))
    ) {
      setError(
        "Add your resume, full name, and a valid international phone number",
      );
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };
  const selectResume = async (file: File | null) => {
    setResume(file);
    setError(null);
    if (
      !file ||
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
    )
      return;
    setParsing(true);
    const body = new FormData();
    body.set("resume", file, file.name);
    const response = await fetch("/api/applications/parse-resume", {
      method: "POST",
      body,
    });
    const payload = (await response.json().catch(() => null)) as {
      parsed?: {
        fullName: string | null;
        email: string | null;
        phone: string | null;
        skills: string[];
      };
      message?: string;
    } | null;
    setParsing(false);
    if (!response.ok || !payload?.parsed)
      return setError(
        payload?.message ?? "Resume autofill unavailable; continue manually",
      );
    if (payload.parsed.fullName)
      form.setFieldValue("fullName", payload.parsed.fullName);
    if (payload.parsed.email) form.setFieldValue("email", payload.parsed.email);
    if (payload.parsed.phone) form.setFieldValue("phone", payload.parsed.phone);
    if (payload.parsed.skills.length)
      form.setFieldValue("skills", payload.parsed.skills.join(", "));
  };

  if (hasApplied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-900">
        An active application already exists for this role. Track it from{" "}
        <a className="font-bold underline" href="/my-applications">
          My applications
        </a>
        .
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      noValidate
    >
      <ol
        className="mb-8 grid grid-cols-4 gap-2"
        aria-label="Application progress"
      >
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-xl px-2 py-3 text-center text-xs font-bold ${index <= step ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            <span className="hidden sm:inline">{index + 1}. </span>
            {label}
          </li>
        ))}
      </ol>
      {error ? (
        <p
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <DraftPersistence
            jobId={job.id}
            storageKey={draftKey}
            step={step}
            answers={answers}
            values={values}
          />
        )}
      </form.Subscribe>
      {draftRestored ? (
        <p
          className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          role="status"
        >
          Your saved draft was restored. Select the resume and answer files
          again before submitting.
        </p>
      ) : null}
      {uploadProgress !== null ? (
        <div className="mb-5" role="status" aria-live="polite">
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
            <span>Uploading application</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-600 transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {step === 0 ? (
        <section>
          <p className="section-kicker">Open role</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
            {job.title}
          </h2>
          <p className="mt-2 text-slate-600">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <p className="mt-6 leading-8 whitespace-pre-line text-slate-600">
            {job.description}
          </p>
        </section>
      ) : null}
      {step === 1 ? (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">Contact details</h2>
          <form.Field name="fullName">
            {(field) => (
              <TextInput label="Full name" type="text" field={field} />
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => <TextInput label="Email" type="email" field={field} />}
          </form.Field>
          <form.Field name="phone">
            {(field) => (
              <TextInput
                label="Phone number (include country code)"
                type="tel"
                field={field}
              />
            )}
          </form.Field>
          <div className="space-y-2">
            <Label htmlFor="resume">
              Resume (PDF, DOC, or DOCX; max 10 MB)
            </Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4 font-semibold text-emerald-800">
              <Upload className="size-5" />
              <span className="truncate">
                {parsing
                  ? "Reading resume…"
                  : (resume?.name ?? "Choose resume")}
              </span>
              <input
                id="resume"
                className="sr-only"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  void selectResume(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <p className="text-xs text-slate-500">
              PDF/DOCX up to 5 MB can be read for autofill. PDF, DOC, and DOCX
              up to 10 MB can still be submitted.
            </p>
          </div>
        </section>
      ) : null}
      {step === 2 ? (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">Professional background</h2>
          <form.Field name="experience">
            {(field) => (
              <TextArea
                label="Experience"
                placeholder="Summarize relevant work experience"
                field={field}
              />
            )}
          </form.Field>
          <form.Field name="education">
            {(field) => (
              <TextArea
                label="Education"
                placeholder="Degrees, certifications, or training"
                field={field}
              />
            )}
          </form.Field>
          <form.Field name="skills">
            {(field) => (
              <TextInput
                label="Skills (comma separated)"
                type="text"
                field={field}
              />
            )}
          </form.Field>
        </section>
      ) : null}
      {step === 3 ? (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Questions & review</h2>
          {job.questions
            .filter((question) => question.id)
            .sort((left, right) => left.order - right.order)
            .map((question) => (
              <Question
                key={question.id}
                question={question}
                answer={question.id ? answers[question.id] : undefined}
                setAnswer={setAnswer}
                setFile={(id, file) =>
                  setQuestionFiles((current) => ({ ...current, [id]: file }))
                }
              />
            ))}
          <form.Field name="coverLetter">
            {(field) => (
              <TextArea
                label="Cover letter"
                placeholder="Why are you a strong fit for this role?"
                field={field}
              />
            )}
          </form.Field>
          <form.Field name="privacyConsentAccepted">
            {(field) => (
              <label className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={field.state.value}
                  onChange={(event) =>
                    field.handleChange(event.target.checked as true)
                  }
                  required
                />
                <span>
                  I have read the{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline"
                  >
                    candidate privacy notice
                  </a>{" "}
                  and consent to ConnectSphere processing my application, profile,
                  and resume.
                </span>
              </label>
            )}
          </form.Field>
        </section>
      ) : null}

      <div className="mt-9 flex items-center justify-between border-t border-slate-100 pt-6">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          <ArrowLeft /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Check /> Submit application
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        )}
      </div>
    </form>
  );
}

function DraftPersistence({
  jobId,
  storageKey,
  step,
  answers,
  values,
}: {
  jobId: string;
  storageKey: string;
  step: number;
  answers: Record<string, Answer>;
  values: ApplicationFields;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const payload = {
        step,
        answers,
        values: {
          ...values,
          questionAnswers: answers,
          privacyConsentAccepted: false,
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      void fetch("/api/applications/drafts", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, payload, currentStep: step }),
      }).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answers, jobId, step, storageKey, values]);
  return null;
}

function uploadApplication(
  body: FormData,
  onProgress: (progress: number | null) => void,
): Promise<{ response: { ok: boolean }; result: unknown }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/applications");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      onProgress(null);
      let result: unknown = null;
      try {
        result = JSON.parse(request.responseText) as unknown;
      } catch {
        result = null;
      }
      resolve({
        response: { ok: request.status >= 200 && request.status < 300 },
        result,
      });
    });
    request.addEventListener("error", () => {
      onProgress(null);
      reject(new Error("Application upload failed"));
    });
    request.send(body);
  });
}

type StringField = {
  name: string;
  state: { value: string };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

function TextInput({
  field,
  label,
  type,
}: {
  field: StringField;
  label: string;
  type: string;
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

function TextArea({
  field,
  label,
  placeholder,
}: {
  field: StringField;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <textarea
        id={field.name}
        className={textareaClass}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </div>
  );
}

type JobQuestion = PublicJobDetail["questions"][number];
function Question({
  question,
  answer,
  setAnswer,
  setFile,
}: {
  question: JobQuestion;
  answer: Answer | undefined;
  setAnswer: (id: string, value: Answer) => void;
  setFile: (id: string, file: File) => void;
}) {
  if (!question.id) return null;
  const id = `question-${question.id}`;
  return (
    <fieldset className="space-y-2">
      <Label htmlFor={id}>
        {question.questionText}
        {question.required ? " *" : ""}
      </Label>
      {question.questionType === "TEXT" ? (
        <textarea
          id={id}
          className={textareaClass}
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => setAnswer(question.id!, event.target.value)}
        />
      ) : null}
      {question.questionType === "MULTIPLE_CHOICE" ? (
        <select
          id={id}
          className={textareaClass.replace("min-h-32", "h-11")}
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => setAnswer(question.id!, event.target.value)}
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : null}
      {question.questionType === "CHECKBOX" ? (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = Array.isArray(answer) ? answer : [];
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(event) =>
                    setAnswer(
                      question.id!,
                      event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option),
                    )
                  }
                />
                {option}
              </label>
            );
          })}
        </div>
      ) : null}
      {question.questionType === "RATING" ? (
        <Input
          id={id}
          type="number"
          min={1}
          max={question.maxRating}
          value={typeof answer === "number" ? answer : ""}
          onChange={(event) =>
            setAnswer(question.id!, Number(event.target.value))
          }
        />
      ) : null}
      {question.questionType === "FILE" ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-4 text-sm font-semibold">
          <FileText className="size-5" />
          Attach document
          <input
            id={id}
            className="sr-only"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setFile(question.id!, file);
            }}
          />
        </label>
      ) : null}
    </fieldset>
  );
}
