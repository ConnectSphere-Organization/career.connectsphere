"use client";

import { useForm } from "@tanstack/react-form";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobInputSchema, type JobInput } from "@/modules/jobs/schema";

const textareaClass =
  "min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10";

export function JobEditorForm({
  initialValues,
  identifier,
  imageUrl,
  sections = "all",
}: {
  initialValues: JobInput;
  identifier?: string;
  imageUrl?: string | null;
  sections?: "all" | "details" | "questions";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = jobInputSchema.safeParse(value);
      if (!parsed.success)
        return setError(
          parsed.error.issues[0]?.message ?? "Review the job details",
        );
      const response = await fetch(
        identifier
          ? `/api/recruitment/jobs/${identifier}`
          : "/api/recruitment/jobs",
        {
          method: identifier ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;
      if (!response.ok) return setError(message ?? "Unable to save job");
      router.push("/recruitment/jobs");
      router.refresh();
    },
  });

  return (
    <form
      className="mt-8 space-y-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {error ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {sections !== "questions" ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Core details</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <form.Field name="title">
                {(field) => <TextInput label="Job title" field={field} />}
              </form.Field>
              <form.Field name="company">
                {(field) => <TextInput label="Company" field={field} />}
              </form.Field>
              <form.Field name="department">
                {(field) => <TextInput label="Department" field={field} />}
              </form.Field>
              <form.Field name="position">
                {(field) => <TextInput label="Position" field={field} />}
              </form.Field>
              <form.Field name="location">
                {(field) => <TextInput label="Location" field={field} />}
              </form.Field>
              <form.Field name="salary">
                {(field) => <TextInput label="Salary range" field={field} />}
              </form.Field>
              <form.Field name="requisitionId">
                {(field) => <TextInput label="Requisition ID" field={field} />}
              </form.Field>
              <form.Field name="headcount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="headcount">Open headcount</Label>
                    <Input
                      id="headcount"
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(Number(event.target.value))
                      }
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="type">Employment type</Label>
                    <select
                      id="type"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={field.state.value ?? ""}
                      onChange={(event) =>
                        field.handleChange(
                          event.target.value
                            ? (event.target.value as JobInput["type"])
                            : null,
                        )
                      }
                    >
                      <option value="">Not specified</option>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>
                )}
              </form.Field>
              <form.Field name="reportingManager">
                {(field) => (
                  <TextInput label="Reporting manager" field={field} />
                )}
              </form.Field>
            </div>
            <div className="mt-5">
              <form.Field name="description">
                {(field) => <TextArea label="Description" field={field} />}
              </form.Field>
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Role expectations</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <form.Field name="requirements">
                {(field) => (
                  <ListArea
                    label="Requirements (one per line)"
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
              <form.Field name="responsibilities">
                {(field) => (
                  <ListArea
                    label="Responsibilities (one per line)"
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            </div>
          </section>
        </>
      ) : null}
      {sections !== "details" ? (
        <form.Field name="questions">
          {(field) => (
            <QuestionEditor
              questions={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
      ) : null}
      {sections !== "questions" ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">HR contact & publication</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <form.Field name="hrContact.name">
                {(field) => <TextInput label="HR name" field={field} />}
              </form.Field>
              <form.Field name="hrContact.email">
                {(field) => (
                  <TextInput label="HR email" field={field} type="email" />
                )}
              </form.Field>
              <form.Field name="hrContact.phone">
                {(field) => <TextInput label="HR phone" field={field} />}
              </form.Field>
              <form.Field name="applicationDeadline">
                {(field) => (
                  <TextInput
                    label="Application deadline"
                    field={field}
                    type="date"
                  />
                )}
              </form.Field>
              <form.Field name="publishAt">
                {(field) => (
                  <TextInput
                    label="Publish at"
                    field={field}
                    type="datetime-local"
                  />
                )}
              </form.Field>
              <form.Field name="unpublishAt">
                {(field) => (
                  <TextInput
                    label="Unpublish at"
                    field={field}
                    type="datetime-local"
                  />
                )}
              </form.Field>
            </div>
            <div className="mt-6 flex flex-wrap gap-6">
              <form.Field name="isActive">
                {(field) => (
                  <Toggle
                    label="Accepting applications"
                    checked={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
              <form.Field name="isPublished">
                {(field) => (
                  <Toggle
                    label="Published publicly"
                    checked={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
              <form.Field name="archived">
                {(field) => (
                  <Toggle
                    label="Archived"
                    checked={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            </div>
          </section>
          {identifier ? (
            <JobImageControl
              identifier={identifier}
              imageUrl={imageUrl}
              onError={setError}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              Save the job before adding its public image.
            </p>
          )}
        </>
      ) : null}
      <div className="flex justify-end">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {isSubmitting ? "Saving…" : "Save job"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

function JobImageControl({
  identifier,
  imageUrl,
  onError,
}: {
  identifier: string;
  imageUrl: string | null | undefined;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    onError(null);
    const body = new FormData();
    body.set("image", file);
    const response = await fetch(`/api/recruitment/jobs/${identifier}/image`, {
      method: "POST",
      body,
    });
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    setBusy(false);
    if (!response.ok)
      return onError(result?.message ?? "Unable to upload job image");
    router.refresh();
  }
  async function remove() {
    setBusy(true);
    onError(null);
    const response = await fetch(`/api/recruitment/jobs/${identifier}/image`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!response.ok) return onError("Unable to remove job image");
    router.refresh();
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Public job image</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Current job"
            width={160}
            height={96}
            className="h-24 w-40 rounded-xl object-cover"
          />
        ) : null}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-semibold">
          <ImagePlus className="size-4" />
          {busy ? "Working…" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
        {imageUrl ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void remove()}
          >
            <Trash2 />
            Remove
          </Button>
        ) : null}
      </div>
    </section>
  );
}

type StringField = {
  name: string;
  state: { value: string };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};
function TextInput({
  label,
  field,
  type = "text",
}: {
  label: string;
  field: StringField;
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
function TextArea({ label, field }: { label: string; field: StringField }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <textarea
        id={field.name}
        className={textareaClass}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </div>
  );
}
function ListArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea
        className={textareaClass}
        value={value.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
      />
    </div>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 font-semibold">
      <input
        className="size-4 accent-emerald-600"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function QuestionEditor({
  questions,
  onChange,
}: {
  questions: JobInput["questions"];
  onChange: (questions: JobInput["questions"]) => void;
}) {
  const update = (
    index: number,
    patch: Partial<JobInput["questions"][number]>,
  ) =>
    onChange(
      questions.map((question, position) =>
        position === index ? { ...question, ...patch } : question,
      ),
    );
  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next.map((question, order) => ({ ...question, order })));
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Application questions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Up to 30 typed screening questions.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange([
              ...questions,
              {
                id: null,
                questionText: "",
                questionType: "TEXT",
                required: false,
                options: [],
                maxRating: 5,
                order: questions.length,
              },
            ])
          }
        >
          <Plus />
          Add question
        </Button>
      </div>
      <div className="mt-5 space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id ?? index}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_12rem_auto]">
              <div className="space-y-2">
                <Label htmlFor={`question-${index}`}>
                  Question {index + 1}
                </Label>
                <Input
                  id={`question-${index}`}
                  value={question.questionText}
                  onChange={(event) =>
                    update(index, { questionText: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`question-type-${index}`}>Type</Label>
                <select
                  id={`question-type-${index}`}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                  value={question.questionType}
                  onChange={(event) =>
                    update(index, {
                      questionType: event.target
                        .value as typeof question.questionType,
                      options: ["MULTIPLE_CHOICE", "CHECKBOX"].includes(
                        event.target.value,
                      )
                        ? question.options
                        : [],
                    })
                  }
                >
                  <option value="TEXT">Text</option>
                  <option value="MULTIPLE_CHOICE">Single choice</option>
                  <option value="CHECKBOX">Checkboxes</option>
                  <option value="FILE">File</option>
                  <option value="RATING">Rating</option>
                </select>
              </div>
              <div className="flex items-end gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move question up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move question down"
                  disabled={index === questions.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete question"
                  onClick={() =>
                    onChange(
                      questions
                        .filter((_, position) => position !== index)
                        .map((item, order) => ({ ...item, order })),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            {["MULTIPLE_CHOICE", "CHECKBOX"].includes(question.questionType) ? (
              <div className="mt-4">
                <ListArea
                  label="Options (one per line)"
                  value={question.options}
                  onChange={(options) => update(index, { options })}
                />
              </div>
            ) : null}
            {question.questionType === "RATING" ? (
              <div className="mt-4 max-w-40 space-y-2">
                <Label htmlFor={`max-rating-${index}`}>Maximum rating</Label>
                <Input
                  id={`max-rating-${index}`}
                  type="number"
                  min={2}
                  max={10}
                  value={question.maxRating}
                  onChange={(event) =>
                    update(index, { maxRating: Number(event.target.value) })
                  }
                />
              </div>
            ) : null}
            <div className="mt-4">
              <Toggle
                label="Required"
                checked={question.required}
                onChange={(required) => update(index, { required })}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
