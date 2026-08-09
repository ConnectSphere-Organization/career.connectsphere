import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assertAssignedJob,
  authorizeRecruitment,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError, apiErrorResponse } from "@/lib/http/api-error";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const inputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("note"),
    body: z.string().trim().min(1).max(5_000),
    visibility: z
      .enum(["PRIVATE", "RECRUITING_TEAM", "HIRING_TEAM"])
      .default("RECRUITING_TEAM"),
    mentionedUserIds: z.array(objectId).max(30).default([]),
  }),
  z.object({
    action: z.literal("task"),
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2_000).optional(),
    ownerId: objectId,
    dueAt: z.coerce.date().optional(),
  }),
  z.object({ action: z.literal("owner"), ownerId: objectId.nullable() }),
  z.object({
    action: z.literal("tag"),
    name: z.string().trim().min(1).max(80),
    color: z.string().trim().max(40).optional(),
  }),
]);

async function scopedApplication(
  identifier: string,
  actor: Awaited<ReturnType<typeof authorizeRecruitment>>,
) {
  const application = await prisma.application.findFirst({
    where: /^[a-f\d]{24}$/i.test(identifier)
      ? { OR: [{ id: identifier }, { slug: identifier }] }
      : { slug: identifier },
    select: { id: true, jobId: true, tagIds: true },
  });
  if (!application) throw new ApiError("Application not found", 404);
  assertAssignedJob(actor, application.jobId);
  return application;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const application = await scopedApplication(
      (await params).identifier,
      actor,
    );
    const [notes, activities, tasks, tags] = await Promise.all([
      prisma.candidateNote.findMany({
        where: {
          applicationId: application.id,
          ...(actor.isAdministrator ? {} : { visibility: { not: "PRIVATE" } }),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.applicationActivity.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.recruitingTask.findMany({
        where: { applicationId: application.id },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        take: 100,
      }),
      prisma.candidateTag.findMany({
        where: { id: { in: application.tagIds } },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({ notes, activities, tasks, tags });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load candidate collaboration");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canManageCandidateCollaboration");
    const application = await scopedApplication(
      (await params).identifier,
      actor,
    );
    const input = inputSchema.parse(await request.json());
    if (input.action === "note") {
      const note = await prisma.candidateNote.create({
        data: {
          applicationId: application.id,
          authorId: actor.id,
          body: input.body,
          visibility: input.visibility,
          mentionedUserIds: input.mentionedUserIds,
        },
      });
      await prisma.applicationActivity.create({
        data: {
          applicationId: application.id,
          actorId: actor.id,
          type: "NOTE_ADDED",
          summary: "Recruiter note added",
          metadata: {
            noteId: note.id,
            mentions: input.mentionedUserIds.length,
          },
        },
      });
      return NextResponse.json({ record: note }, { status: 201 });
    }
    if (input.action === "task") {
      const task = await prisma.recruitingTask.create({
        data: {
          applicationId: application.id,
          title: input.title,
          description: input.description ?? null,
          ownerId: input.ownerId,
          dueAt: input.dueAt ?? null,
          createdBy: actor.id,
        },
      });
      return NextResponse.json({ record: task }, { status: 201 });
    }
    if (input.action === "owner") {
      await prisma.application.update({
        where: { id: application.id },
        data: { ownerId: input.ownerId },
      });
      const activity = await prisma.applicationActivity.create({
        data: {
          applicationId: application.id,
          actorId: actor.id,
          type: "OWNER_CHANGED",
          summary: input.ownerId
            ? "Application owner assigned"
            : "Application owner cleared",
          metadata: { ownerId: input.ownerId },
        },
      });
      return NextResponse.json({ record: activity });
    }
    const tag = await prisma.candidateTag.upsert({
      where: { name: input.name },
      create: {
        name: input.name,
        color: input.color ?? null,
        createdBy: actor.id,
      },
      update: { ...(input.color ? { color: input.color } : {}) },
    });
    await prisma.application.update({
      where: { id: application.id },
      data: { tagIds: [...new Set([...application.tagIds, tag.id])] },
    });
    await prisma.applicationActivity.create({
      data: {
        applicationId: application.id,
        actorId: actor.id,
        type: "TAGGED",
        summary: `Tag added: ${tag.name}`,
        metadata: { tagId: tag.id },
      },
    });
    return NextResponse.json({ record: tag }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update candidate collaboration");
  }
}
