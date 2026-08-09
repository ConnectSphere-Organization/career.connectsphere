"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { JobEditorForm } from "@/modules/jobs/components/job-editor-form";
import type { JobInput } from "@/modules/jobs/schema";

type JobTab = "details" | "questions" | "applications";

export function JobWorkspaceTabs({
  initialValues,
  identifier,
  imageUrl,
  applicationCount = 0,
  applications,
  initialTab = "details",
}: {
  initialValues: JobInput;
  identifier?: string;
  imageUrl?: string | null;
  applicationCount?: number;
  applications?: ReactNode;
  initialTab?: JobTab;
}) {
  const router = useRouter();
  const availableInitialTab =
    initialTab === "applications" && !identifier ? "details" : initialTab;
  const [tab, setTab] = useState<JobTab>(availableInitialTab);
  const tabs = [
    { id: "details" as const, label: "Job Details" },
    { id: "questions" as const, label: "Application Questions" },
    ...(identifier
      ? [{ id: "applications" as const, label: "Applications" }]
      : []),
  ];
  function selectTab(nextTab: JobTab) {
    setTab(nextTab);
    const base = identifier
      ? `/recruitment/jobs/${encodeURIComponent(identifier)}/edit`
      : "/recruitment/jobs/new";
    router.replace(`${base}?tab=${nextTab}`, { scroll: false });
  }
  return (
    <div className="mt-8">
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-t-xl border px-6 py-3 font-semibold transition ${tab === item.id ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-transparent bg-white text-slate-500 hover:bg-slate-50"}`}
              onClick={() => selectTab(item.id)}
            >
              {item.label}
              {item.id === "applications" ? (
                <span className="ml-2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {applicationCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      {tab === "details" ? (
        <JobEditorForm
          initialValues={{
            ...initialValues,
            questions: initialValues.questions,
          }}
          {...(identifier === undefined ? {} : { identifier })}
          {...(imageUrl === undefined ? {} : { imageUrl })}
          sections="details"
        />
      ) : null}
      {tab === "questions" ? (
        <JobEditorForm
          initialValues={{
            ...initialValues,
            questions: initialValues.questions,
          }}
          {...(identifier === undefined ? {} : { identifier })}
          {...(imageUrl === undefined ? {} : { imageUrl })}
          sections="questions"
        />
      ) : null}
      {tab === "applications" ? (
        <div className="mt-8">{applications}</div>
      ) : null}
    </div>
  );
}
