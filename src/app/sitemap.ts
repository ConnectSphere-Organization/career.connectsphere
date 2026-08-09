import type { MetadataRoute } from "next";

import { env } from "@/config/env";
import { getPublicJobs } from "@/modules/jobs/server/public-jobs";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getPublicJobs();
  const staticRoutes = [
    "",
    "/jobs",
    "/company",
    "/contact",
    "/verify",
    "/verify-offer",
  ];
  return [
    ...staticRoutes.map((path) => ({
      url: new URL(path || "/", env.APP_URL).toString(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
    ...jobs.map((job) => ({
      url: new URL(`/jobs/${job.slug ?? job.id}`, env.APP_URL).toString(),
      lastModified: job.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
