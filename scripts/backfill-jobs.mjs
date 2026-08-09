import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function slugBase(title) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "job"
  );
}

async function main() {
  const jobs = await prisma.job.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      isActive: true,
    },
  });
  const reserved = new Set(jobs.map((job) => job.slug).filter(Boolean));
  const plan = [];
  for (const job of jobs) {
    const changes = {};
    if (!job.slug) {
      const base = slugBase(job.title);
      let candidate = base;
      let suffix = 2;
      while (reserved.has(candidate))
        candidate = `${base.slice(0, 74)}-${suffix++}`;
      reserved.add(candidate);
      changes.slug = candidate;
    }
    if (job.isPublished === null) changes.isPublished = false;
    if (Object.keys(changes).length) plan.push({ id: job.id, changes });
  }
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        scanned: jobs.length,
        changed: plan.length,
        plan,
      },
      null,
      2,
    ),
  );
  if (!apply) return;
  for (const item of plan)
    await prisma.job.update({ where: { id: item.id }, data: item.changes });
  console.log(`Applied ${plan.length} job backfills.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
