"use client";

import type { ContractStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ContractStatusControl({
  id,
  transitions,
}: {
  id: string;
  transitions: readonly ContractStatus[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ContractStatus | "">(
    transitions[0] ?? "",
  );
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (transitions.length === 0)
    return (
      <p className="text-sm text-slate-500">
        No further status transitions are permitted.
      </p>
    );
  async function submit() {
    if (!status) return;
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/recruitment/contracts/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, comments }),
    });
    const result: unknown = await response.json().catch(() => null);
    setMessage(
      typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
        ? result.message
        : response.ok
          ? "Status updated"
          : "Unable to update status",
    );
    setPending(false);
    if (response.ok) router.refresh();
  }
  return (
    <div className="space-y-3">
      <select
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
        value={status}
        onChange={(event) => setStatus(event.target.value as ContractStatus)}
      >
        {transitions.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 w-full rounded-xl border border-slate-200 p-3"
        value={comments}
        onChange={(event) => setComments(event.target.value)}
        maxLength={2000}
        placeholder="Review comments (required for rejection or clarification)"
      />
      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button type="button" disabled={pending} onClick={() => void submit()}>
        {pending ? "Updating…" : "Update status"}
      </Button>
    </div>
  );
}
