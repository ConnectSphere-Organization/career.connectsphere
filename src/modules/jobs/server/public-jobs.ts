import "server-only";

import { prisma } from "@/lib/db/prisma";
import { EmploymentType, type Prisma } from "@prisma/client";

import type {
  PublicJob,
  PublicJobDetail,
  PublicJobSearchResult,
} from "@/modules/jobs/types";

export function publicJobVisibilityFilters(
  now = new Date(),
): Prisma.JobWhereInput[] {
  return [
    { OR: [{ isPublished: true }, { isPublished: { isSet: false } }] },
    {
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gte: now } },
        { applicationDeadline: { isSet: false } },
      ],
    },
    {
      OR: [
        { publishAt: null },
        { publishAt: { lte: now } },
        { publishAt: { isSet: false } },
      ],
    },
    {
      OR: [
        { unpublishAt: null },
        { unpublishAt: { gt: now } },
        { unpublishAt: { isSet: false } },
      ],
    },
  ];
}

export function publicJobBaseWhere(now = new Date()): Prisma.JobWhereInput {
  return {
    isActive: true,
    archivedAt: null,
    AND: publicJobVisibilityFilters(now),
  };
}

export async function getPublicJobs(): Promise<PublicJob[]> {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is required to load public jobs");
  return prisma.job.findMany({
    where: publicJobBaseWhere(),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      description: true,
      location: true,
      type: true,
      salary: true,
      department: true,
      imageUrl: true,
      createdAt: true,
    },
    take: 10_000,
  });
}

export async function searchPublicJobs(
  input: {
    query?: string;
    department?: string;
    location?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PublicJobSearchResult> {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is required to search public jobs");
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 12));
  const query = input.query?.trim().slice(0, 100) ?? "";
  const now = new Date();
  const published: Prisma.JobWhereInput = {
    isActive: true,
    archivedAt: null,
    AND: [
      ...publicJobVisibilityFilters(now),
      ...(query
        ? [
            {
              OR: [
                "title",
                "company",
                "description",
                "location",
                "department",
              ].map((field) => ({
                [field]: { contains: query, mode: "insensitive" },
              })),
            } as Prisma.JobWhereInput,
          ]
        : []),
    ],
    ...(input.department ? { department: input.department } : {}),
    ...(input.location ? { location: input.location } : {}),
    ...(input.type &&
    Object.values(EmploymentType).includes(input.type as EmploymentType)
      ? { type: input.type as EmploymentType }
      : {}),
  };
  const select = {
    id: true,
    slug: true,
    title: true,
    company: true,
    description: true,
    location: true,
    type: true,
    salary: true,
    department: true,
    imageUrl: true,
    createdAt: true,
  } satisfies Prisma.JobSelect;
  const [jobs, total, facetRows] = await prisma.$transaction([
    prisma.job.findMany({
      where: published,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select,
    }),
    prisma.job.count({ where: published }),
    prisma.job.findMany({
      where: publicJobBaseWhere(now),
      take: 5_000,
      select: { department: true, location: true, type: true },
    }),
  ]);
  const count = (values: Array<string | null>) =>
    [
      ...values.reduce(
        (map, value) =>
          value ? map.set(value, (map.get(value) ?? 0) + 1) : map,
        new Map<string, number>(),
      ),
    ]
      .map(([value, count]) => ({ value, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.value.localeCompare(right.value),
      );
  return {
    jobs,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      departments: count(facetRows.map((row) => row.department)),
      locations: count(facetRows.map((row) => row.location)),
      types: count(facetRows.map((row) => row.type)),
    },
  };
}

export async function getPublicJob(
  identifier: string,
): Promise<PublicJobDetail | null> {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is required to load a public job");
  if (!identifier) return null;

  const isObjectId = /^[a-f\d]{24}$/i.test(identifier);

  return prisma.job.findFirst({
    where: {
      isActive: true,
      archivedAt: null,
      AND: [
        ...publicJobVisibilityFilters(),
        isObjectId
          ? { OR: [{ id: identifier }, { slug: identifier }] }
          : { slug: identifier },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      description: true,
      requirements: true,
      responsibilities: true,
      location: true,
      type: true,
      salary: true,
      department: true,
      position: true,
      reportingManager: true,
      requisitionId: true,
      headcount: true,
      applicationDeadline: true,
      publishAt: true,
      imageUrl: true,
      hrContact: true,
      questions: true,
      createdAt: true,
    },
  });
}
