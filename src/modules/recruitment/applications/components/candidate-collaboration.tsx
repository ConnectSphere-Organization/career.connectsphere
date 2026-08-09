"use client";

import {
  AtSign,
  CheckSquare,
  LoaderCircle,
  MessageSquareText,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CollaborationData = {
  notes: Array<{
    id: string;
    body: string;
    visibility: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    summary: string;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
  }>;
  tags: Array<{ id: string; name: string; color: string | null }>;
};

export function CandidateCollaboration({
  identifier,
  actorId,
}: {
  identifier: string;
  actorId: string;
}) {
  const [data, setData] = useState<CollaborationData | null>(null);
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = `/api/recruitment/applications/${encodeURIComponent(identifier)}/collaboration`;
  const load = useCallback(async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      (CollaborationData & { message?: string }) | null;
    if (!response.ok || !payload)
      return setError(
        payload?.message ?? "Unable to load collaboration history",
      );
    setData(payload);
    setError(null);
  }, [endpoint]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function create(body: object) {
    setBusy(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    setBusy(false);
    if (!response.ok)
      return setError(payload?.message ?? "Unable to update collaboration");
    setNote("");
    setTask("");
    setTag("");
    await load();
  }
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6"
      aria-labelledby="collaboration-heading"
    >
      <div className="flex items-center gap-3">
        <MessageSquareText
          className="size-5 text-emerald-700"
          aria-hidden="true"
        />
        <div>
          <h2
            id="collaboration-heading"
            className="text-lg font-semibold text-slate-950"
          >
            Recruiting collaboration
          </h2>
          <p className="text-sm text-slate-600">
            Notes, tags, owned tasks and the application activity timeline.
          </p>
        </div>
      </div>
      {error ? (
        <p
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (note.trim())
              void create({
                action: "note",
                body: note,
                visibility: "RECRUITING_TEAM",
                mentionedUserIds: [],
              });
          }}
        >
          <Label htmlFor="candidate-note">Add team note</Label>
          <textarea
            id="candidate-note"
            className="min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button size="sm" disabled={busy || !note.trim()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <AtSign />}Add
            note
          </Button>
        </form>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (task.trim())
              void create({ action: "task", title: task, ownerId: actorId });
          }}
        >
          <Label htmlFor="candidate-task">Create task for me</Label>
          <Input
            id="candidate-task"
            value={task}
            onChange={(event) => setTask(event.target.value)}
          />
          <Button size="sm" variant="secondary" disabled={busy || !task.trim()}>
            <CheckSquare />
            Create task
          </Button>
        </form>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (tag.trim()) void create({ action: "tag", name: tag });
          }}
        >
          <Label htmlFor="candidate-tag">Add tag</Label>
          <Input
            id="candidate-tag"
            value={tag}
            onChange={(event) => setTag(event.target.value)}
          />
          <Button size="sm" variant="secondary" disabled={busy || !tag.trim()}>
            <Tag />
            Add tag
          </Button>
        </form>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Notes and tasks
          </h3>
          <div className="mt-3 divide-y divide-slate-100 border-y border-slate-200">
            {data?.notes.map((item) => (
              <article key={item.id} className="py-3">
                <p className="text-sm text-slate-800">{item.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.visibility.replaceAll("_", " ")} ·{" "}
                  {formatDate(item.createdAt)}
                </p>
              </article>
            ))}
            {data?.tasks.map((item) => (
              <article
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.dueAt ? formatDate(item.dueAt) : "No due date"}
                  </p>
                </div>
                <span className="text-xs font-semibold">{item.status}</span>
              </article>
            ))}
            {data && data.notes.length + data.tasks.length === 0 ? (
              <p className="py-5 text-sm text-slate-500">
                No notes or tasks yet.
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data?.tags.map((item) => (
              <span
                key={item.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Activity timeline
          </h3>
          <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
            {data?.activities.map((item) => (
              <li key={item.id}>
                <p className="text-sm text-slate-800">{item.summary}</p>
                <p className="text-xs text-slate-500">
                  {item.type.replaceAll("_", " ")} ·{" "}
                  {formatDate(item.createdAt)}
                </p>
              </li>
            ))}
            {data?.activities.length === 0 ? (
              <li className="text-sm text-slate-500">
                No activity recorded yet.
              </li>
            ) : null}
          </ol>
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
