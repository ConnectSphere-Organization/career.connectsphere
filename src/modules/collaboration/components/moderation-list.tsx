"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ModerationKind = "reviews" | "recommendations";
type ModerationItem = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  status: string;
  details?: string[];
  href?: string;
  actionLabel?: string;
};
type ApiMessage = { message?: string };

export function ModerationList({
  kind,
  items,
}: {
  kind: ModerationKind;
  items: ModerationItem[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function moderate(id: string, status: string, note: string) {
    setBusyId(id);
    setMessage(null);
    const body =
      kind === "reviews"
        ? {
            status,
            moderatorNotes: note || null,
            rejectionReason: status === "REJECTED" ? note : null,
          }
        : { status, adminNotes: note || null };
    const response = await fetch(
      `/api/admin/${kind}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setBusyId(null);
    if (!response.ok) {
      const payload = (await response.json()) as ApiMessage;
      return setMessage(payload.message ?? "Unable to moderate item");
    }
    window.location.reload();
  }

  return (
    <section className="space-y-4">
      {message ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">
          {message}
        </p>
      ) : null}
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="text-sm text-slate-500">{item.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold">
                {item.status}
              </span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {item.actionLabel ?? "Open"}
                </Link>
              ) : null}
            </div>
          </div>
          {item.details?.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.details.map((detail) => (
                <li
                  key={detail}
                  className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"
                >
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {item.body}
          </p>
          {item.status === "PENDING" ||
          (kind === "recommendations" && item.status === "REVIEWED") ? (
            <ModerationControls
              kind={kind}
              disabled={busyId === item.id}
              onSubmit={(status, note) => moderate(item.id, status, note)}
            />
          ) : null}
        </article>
      ))}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
          Nothing requires moderation.
        </p>
      ) : null}
    </section>
  );
}

function ModerationControls({
  kind,
  disabled,
  onSubmit,
}: {
  kind: ModerationKind;
  disabled: boolean;
  onSubmit: (status: string, note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-5 border-t pt-5">
      <label className="text-sm font-bold" htmlFor={`note-${kind}`}>
        Moderator note{" "}
        <span className="font-normal text-slate-500">
          (required when rejecting)
        </span>
      </label>
      <textarea
        id={`note-${kind}`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={1000}
        className="mt-2 min-h-20 w-full rounded-md border p-3"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {kind === "reviews" ? (
          <>
            <Button
              type="button"
              disabled={disabled}
              onClick={() => onSubmit("APPROVED", note)}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disabled || !note.trim()}
              onClick={() => onSubmit("REJECTED", note)}
            >
              Reject
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={disabled}
              onClick={() => onSubmit("REVIEWED", note)}
            >
              Mark reviewed
            </Button>
            <Button
              type="button"
              disabled={disabled}
              onClick={() => onSubmit("SELECTED", note)}
            >
              Select
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disabled || !note.trim()}
              onClick={() => onSubmit("REJECTED", note)}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
