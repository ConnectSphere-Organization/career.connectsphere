"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExistingReview = {
  id: string;
  rating: number;
  title: string;
  content: string;
  status: string;
  isAnonymous: boolean;
  rejectionReason: string | null;
};

type Props = { review: ExistingReview | null };

type ApiMessage = { message?: string };

export function ReviewSubmissionForm({ review }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (review) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{review.title}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
            {review.status}
          </span>
        </div>
        <p
          className="mt-2 text-amber-500"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-slate-600">
          {review.content}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Identity: {review.isAnonymous ? "Anonymous" : "Shown after approval"}
        </p>
        {review.rejectionReason ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            <strong>Moderation feedback:</strong> {review.rejectionReason}
          </p>
        ) : null}
      </section>
    );
  }

  async function submit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    const nullable = (name: string) =>
      String(formData.get(name) ?? "").trim() || null;
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: Number(formData.get("rating")),
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        department: nullable("department"),
        position: nullable("position"),
        workType: nullable("workType"),
        employmentDuration: nullable("employmentDuration"),
        pros: nullable("pros"),
        cons: nullable("cons"),
        advice: nullable("advice"),
        isAnonymous: formData.get("isAnonymous") === "on",
      }),
    });
    const payload = (await response.json()) as ApiMessage;
    setSubmitting(false);
    if (!response.ok)
      return setMessage(payload.message ?? "Unable to submit review");
    window.location.reload();
  }

  return (
    <form
      action={submit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="rating">Rating</Label>
          <select
            id="rating"
            name="rating"
            required
            defaultValue="5"
            className="mt-2 h-11 w-full rounded-md border bg-white px-3"
          >
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Average</option>
            <option value="2">2 — Poor</option>
            <option value="1">1 — Very poor</option>
          </select>
        </div>
        <div>
          <Label htmlFor="workType">Work type</Label>
          <select
            id="workType"
            name="workType"
            defaultValue=""
            className="mt-2 h-11 w-full rounded-md border bg-white px-3"
          >
            <option value="">Not specified</option>
            <option value="REMOTE">Remote</option>
            <option value="ON_SITE">On-site</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            className="mt-2"
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            name="position"
            className="mt-2"
            maxLength={100}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="employmentDuration">Employment duration</Label>
          <Input
            id="employmentDuration"
            name="employmentDuration"
            className="mt-2"
            maxLength={100}
            placeholder="e.g. 2 years"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="title">Review title</Label>
          <Input
            id="title"
            name="title"
            className="mt-2"
            minLength={3}
            maxLength={120}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="content">Review</Label>
          <textarea
            id="content"
            name="content"
            minLength={20}
            maxLength={3000}
            required
            className="mt-2 min-h-36 w-full rounded-md border bg-white p-3"
          />
        </div>
        <div>
          <Label htmlFor="pros">What worked well?</Label>
          <textarea
            id="pros"
            name="pros"
            maxLength={1000}
            className="mt-2 min-h-24 w-full rounded-md border bg-white p-3"
          />
        </div>
        <div>
          <Label htmlFor="cons">What could improve?</Label>
          <textarea
            id="cons"
            name="cons"
            maxLength={1000}
            className="mt-2 min-h-24 w-full rounded-md border bg-white p-3"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="advice">Advice to leadership</Label>
          <textarea
            id="advice"
            name="advice"
            maxLength={1000}
            className="mt-2 min-h-24 w-full rounded-md border bg-white p-3"
          />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="isAnonymous" className="size-4" />
        Publish anonymously if approved
      </label>
      {message ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit for moderation"}
      </Button>
    </form>
  );
}
