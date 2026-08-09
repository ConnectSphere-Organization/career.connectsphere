"use client";

import { useForm } from "@tanstack/react-form";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recaptchaToken } from "@/lib/security/recaptcha-client";
import { contactSchema } from "@/modules/contact/schema";

const fields = [
  {
    name: "name",
    label: "Your name *",
    type: "text",
    placeholder: "Enter your full name",
  },
  {
    name: "email",
    label: "Email address *",
    type: "email",
    placeholder: "your.email@example.com",
  },
  {
    name: "phone",
    label: "Phone number",
    type: "tel",
    placeholder: "Your phone number",
  },
  {
    name: "company",
    label: "Company",
    type: "text",
    placeholder: "Your company name",
  },
] as const;

export function ContactForm() {
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", company: "", message: "" },
    onSubmit: async ({ value, formApi }) => {
      setFeedback(null);
      const parsed = contactSchema.safeParse(value);
      if (!parsed.success) {
        setFeedback({
          kind: "error",
          message: parsed.error.issues[0]?.message ?? "Check the form",
        });
        return;
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          recaptchaToken: await recaptchaToken("contact"),
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setFeedback({
          kind: "error",
          message: body.message ?? "Failed to send message",
        });
        return;
      }
      setFeedback({ kind: "success", message: body.message ?? "Message sent" });
      formApi.reset();
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      noValidate
    >
      {feedback ? (
        <p
          role="status"
          className={
            feedback.kind === "success"
              ? "flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="size-5" aria-hidden="true" />
          ) : null}
          {feedback.message}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        {fields.map((item) => (
          <form.Field key={item.name} name={item.name}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{item.label}</Label>
                <Input
                  id={field.name}
                  type={item.type}
                  placeholder={item.placeholder}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required={item.name === "name" || item.name === "email"}
                />
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <form.Field name="message">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Your message *</Label>
            <textarea
              id={field.name}
              rows={6}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm transition outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              placeholder="Hello, can you help me with..."
              required
            />
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />{" "}
                  Sending…
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
