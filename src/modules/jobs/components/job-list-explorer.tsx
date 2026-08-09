"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  IndianRupee,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicJob } from "@/modules/jobs/types";
import { formatSalary, isNewJob, parseSalary } from "@/modules/jobs/utils";

type SortOption = "newest" | "oldest" | "salary-high" | "salary-low";

export function JobListExplorer({
  jobs,
  applicationStatuses = {},
  initialSearch = "",
  page = 1,
  total = jobs.length,
  totalPages = 1,
}: {
  jobs: PublicJob[];
  applicationStatuses?: Record<string, { status: string; identifier: string }>;
  initialSearch?: string;
  page?: number;
  total?: number;
  totalPages?: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const jobTypes = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((job) => job.type)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs
      .filter((job) => {
        const matchesSearch =
          !term ||
          [job.title, job.company, job.location ?? ""].some((value) =>
            value.toLowerCase().includes(term),
          );
        return matchesSearch && (!type || job.type === type);
      })
      .toSorted((left, right) => {
        if (sort === "oldest")
          return left.createdAt.getTime() - right.createdAt.getTime();
        if (sort === "salary-high")
          return parseSalary(right.salary) - parseSalary(left.salary);
        if (sort === "salary-low")
          return parseSalary(left.salary) - parseSalary(right.salary);
        return right.createdAt.getTime() - left.createdAt.getTime();
      });
  }, [jobs, search, sort, type]);

  const reset = () => {
    setSearch("");
    setType("");
    setSort("newest");
    router.push("/jobs");
  };

  const submitSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    router.push(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  };

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("q", initialSearch);
    params.set("page", String(target));
    return `/jobs?${params.toString()}`;
  };

  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-blue-100 bg-blue-50 px-6 py-12 text-center sm:px-10 md:py-16">
        <div className="absolute -top-24 -left-20 size-64 rounded-full bg-white/80 blur-3xl" />
        <div className="absolute right-0 -bottom-28 size-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="relative">
          <p className="section-kicker">Open opportunities</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
            Find your place at{" "}
            <span className="text-blue-600">ConnectSphere</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Search thoughtful roles, understand what matters, and apply with
            confidence.
          </p>
          <form
            className="relative mx-auto mt-8 max-w-3xl"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            role="search"
          >
            <Search
              className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blue-600"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search job titles, companies, or locations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search job titles, companies, or locations..."
              className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-12 text-slate-900 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </form>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Showing{" "}
          <span className="mx-1 rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
            {filteredJobs.length}
          </span>{" "}
          of {total} <span className="hidden sm:inline">job opportunities</span>
          <span className="sm:hidden">jobs</span>
        </p>
        <div className="hidden items-center gap-2 sm:flex">
          <label className="sr-only" htmlFor="job-type">
            Job type
          </label>
          <select
            id="job-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">All types</option>
            {jobTypes.map((jobType) => (
              <option key={jobType}>{jobType}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="job-sort">
            Sort jobs
          </label>
          <select
            id="job-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="salary-high">Salary: high</option>
            <option value="salary-low">Salary: low</option>
          </select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="sm:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal aria-hidden="true" /> Filters
        </Button>
      </div>

      {filteredJobs.length ? (
        <div className="space-y-5">
          {filteredJobs.map((job) => {
            const identifier = job.slug ?? job.id;
            const application = applicationStatuses[job.id];
            return (
              <Card
                key={job.id}
                className="group relative overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
              >
                {isNewJob(job.createdAt) ? (
                  <span className="absolute top-0 right-0 rounded-bl-xl bg-blue-600 px-3 py-1 text-xs font-extrabold tracking-wider text-white">
                    NEW
                  </span>
                ) : null}
                <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="hidden size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:flex sm:items-center sm:justify-center">
                    {job.imageUrl ? (
                      <Image
                        src={job.imageUrl}
                        alt=""
                        width={80}
                        height={80}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-extrabold text-blue-700">
                        {job.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${identifier}`}
                      className="inline-flex items-center gap-2 text-xl font-bold text-slate-950 hover:text-blue-700"
                    >
                      {job.title}
                      <ArrowRight
                        className="size-5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Building2
                          className="size-4 text-blue-600"
                          aria-hidden="true"
                        />
                        {job.company}
                      </span>
                      {job.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin
                            className="size-4 text-blue-600"
                            aria-hidden="true"
                          />
                          {job.location}
                        </span>
                      ) : null}
                      {job.salary ? (
                        <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                          <IndianRupee className="size-4" aria-hidden="true" />
                          {formatSalary(job.salary)?.replace(/^₹/, "")}
                        </span>
                      ) : null}
                      {job.type ? (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-0.5 font-semibold text-blue-700">
                          {job.type}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 leading-7 text-slate-600">
                      {job.description}
                    </p>
                    {application ? (
                      <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Application: {application.status.replaceAll("_", " ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid w-full gap-2 sm:w-auto">
                    <Link
                      href={`/jobs/${identifier}`}
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "w-full",
                      )}
                    >
                      View role
                    </Link>
                    {application ? (
                      <Link
                        href="/my-applications"
                        className={cn(buttonVariants(), "w-full")}
                      >
                        View application
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <BriefcaseBusiness
              className="mx-auto size-14 text-slate-300"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              No matching jobs found
            </h2>
            <p className="mt-2 text-slate-500">
              Try changing your search or filters.
            </p>
            <Button variant="secondary" className="mt-6" onClick={reset}>
              Reset filters
            </Button>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5"
          aria-label="Job result pages"
        >
          <Link
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "secondary" }),
              page <= 1 && "pointer-events-none opacity-50",
            )}
            href={pageHref(Math.max(1, page - 1))}
          >
            Previous
          </Link>
          <p className="text-sm text-slate-600">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </p>
          <Link
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "secondary" }),
              page >= totalPages && "pointer-events-none opacity-50",
            )}
            href={pageHref(Math.min(totalPages, page + 1))}
          >
            Next
          </Link>
        </nav>
      ) : null}

      <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-blue-100 bg-blue-50 p-6 md:flex-row">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Ready to apply for your dream job?
          </h2>
          <p className="mt-1 text-slate-600">
            Sign in or create an account to begin your career journey.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants()}>
            Sign in
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "secondary" })}
          >
            Create account
          </Link>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filters-title"
        >
          <button
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="relative w-full rounded-t-[2rem] bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between">
              <h2 id="filters-title" className="text-xl font-extrabold">
                Refine <span className="text-blue-600">jobs</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X />
              </Button>
            </div>
            <fieldset className="mt-6">
              <legend className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                Job category
              </legend>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                <FilterChip active={!type} onClick={() => setType("")}>
                  All types
                </FilterChip>
                {jobTypes.map((jobType) => (
                  <FilterChip
                    key={jobType}
                    active={type === jobType}
                    onClick={() => setType(jobType)}
                  >
                    {jobType}
                  </FilterChip>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-6">
              <legend className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                Sort by
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ["newest", "Newest"],
                    ["oldest", "Oldest"],
                    ["salary-high", "Highest salary"],
                    ["salary-low", "Lowest salary"],
                  ] as const
                ).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    active={sort === value}
                    onClick={() => setSort(value)}
                  >
                    {label}
                  </FilterChip>
                ))}
              </div>
            </fieldset>
            <Button
              className="mt-8 w-full"
              size="lg"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply filters
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-600",
      )}
    >
      {children}
    </button>
  );
}
