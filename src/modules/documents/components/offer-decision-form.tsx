"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { offerDecisionSchema } from "@/modules/documents/schema";

export function OfferDecisionForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const form = useForm({
    defaultValues: {
      decision: "ACCEPTED" as "ACCEPTED" | "REJECTED",
      comments: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = offerDecisionSchema.safeParse(value);
      if (!parsed.success)
        return setMessage(
          parsed.error.issues[0]?.message ?? "Review your response",
        );
      const response = await fetch(
        `/api/offers/accept/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
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
        responseMessage ??
          (response.ok ? "Response recorded" : "Unable to record response"),
      );
      if (response.ok) {
        const onboarding =
          typeof result === "object" &&
          result !== null &&
          "contractOnboarding" in result &&
          typeof result.contractOnboarding === "string"
            ? result.contractOnboarding
            : null;
        if (onboarding) return router.push(onboarding);
        setComplete(true);
      }
    },
  });
  if (complete)
    return (
      <p
        className="rounded-2xl bg-emerald-50 p-5 font-bold text-emerald-800"
        role="status"
      >
        {message}
      </p>
    );
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {message ? (
        <p className="rounded-xl bg-rose-50 p-3 text-rose-700" role="alert">
          {message}
        </p>
      ) : null}
      <form.Field name="comments">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (optional)</Label>
            <textarea
              id="comments"
              className="min-h-28 w-full rounded-xl border border-slate-200 p-3"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <div className="flex flex-wrap gap-3">
        <form.Field name="decision">
          {(field) => (
            <>
              <Button
                type="submit"
                onClick={() => field.handleChange("ACCEPTED")}
              >
                Accept offer
              </Button>
              <Button
                type="submit"
                variant="destructive"
                onClick={() => field.handleChange("REJECTED")}
              >
                Reject offer
              </Button>
            </>
          )}
        </form.Field>
      </div>
    </form>
  );
}
