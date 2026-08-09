import "server-only";

import { prisma } from "@/lib/db/prisma";

export function normalizeJobSlug(title: string): string {
  return (
    title
      .normalize("NFKD")
      .toLowerCase()
      .trim()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "job"
  );
}

export async function generateUniqueJobSlug(
  title: string,
  excludeJobId?: string,
): Promise<string> {
  const base = normalizeJobSlug(title);
  const candidates = Array.from({ length: 100 }, (_, index) =>
    index === 0 ? base : `${base}-${index + 1}`,
  );
  const existing = await prisma.job.findMany({
    where: {
      slug: { in: candidates },
      ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
    },
    select: { slug: true },
  });
  const unavailable = new Set(
    existing.flatMap((job) => (job.slug ? [job.slug] : [])),
  );
  const available = candidates.find((candidate) => !unavailable.has(candidate));
  if (!available) throw new Error("Unable to allocate a unique job slug");
  return available;
}
