"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string | Date;
  job: { slug: string | null; title: string } | null;
};
type ApiMessage = { message?: string };

export function NotificationsList({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function mutate(url: string, method: "PATCH" | "DELETE") {
    setBusy(true);
    setMessage(null);
    const response = await fetch(url, { method });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as ApiMessage;
      return setMessage(payload.message ?? "Unable to update notifications");
    }
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <strong>{unreadCount}</strong> unread
        </p>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => mutate("/api/notifications", "PATCH")}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : null}
      </div>
      {message ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-800"
        >
          {message}
        </p>
      ) : null}
      <section className="space-y-3">
        {notifications.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-5 shadow-sm ${item.isRead ? "bg-white" : "border-emerald-200 bg-emerald-50/50"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{item.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold">
                    {item.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.message}
                </p>
                <time className="mt-3 block text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>
              <div className="flex shrink-0 gap-2">
                {!item.isRead ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        `/api/notifications/${encodeURIComponent(item.id)}`,
                        "PATCH",
                      )
                    }
                    className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-100"
                    aria-label={`Mark ${item.title} read`}
                  >
                    <CheckCheck className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      `/api/notifications/${encodeURIComponent(item.id)}`,
                      "DELETE",
                    )
                  }
                  className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
            No notifications.
          </p>
        ) : null}
      </section>
    </div>
  );
}
