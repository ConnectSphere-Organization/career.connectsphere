import "server-only";

import type { ReviewStatus } from "@prisma/client";

import { recordAudit } from "@/lib/audit/audit";
import type { CollaborationActor } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  reviewModerationSchema,
  reviewSchema,
} from "@/modules/collaboration/schema";

export async function getOwnReview(actor: CollaborationActor) {
  return prisma.review.findFirst({
    where: { userId: actor.id },
    select: {
      id: true,
      rating: true,
      title: true,
      content: true,
      status: true,
      isAnonymous: true,
      rejectionReason: true,
      createdAt: true,
    },
  });
}

export async function submitReview(raw: unknown, actor: CollaborationActor) {
  const input = reviewSchema.parse(raw);
  if (
    await prisma.review.findFirst({
      where: { userId: actor.id },
      select: { id: true },
    })
  )
    throw new ApiError("A review has already been submitted", 409);
  const review = await prisma.review.create({
    data: {
      ...input,
      userId: actor.id,
      userEmail: actor.email,
      userName: input.isAnonymous ? "Anonymous" : actor.name,
      reviewerType: "EMPLOYEE",
      status: "PENDING",
    },
    select: { id: true, status: true, createdAt: true },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Review",
    resourceId: review.id,
    changes: { status: review.status },
  });
  return review;
}

export async function listReviewsForModeration(status?: ReviewStatus) {
  return prisma.review.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      userName: true,
      rating: true,
      title: true,
      content: true,
      pros: true,
      cons: true,
      advice: true,
      status: true,
      reviewerType: true,
      isAnonymous: true,
      moderatorNotes: true,
      rejectionReason: true,
      createdAt: true,
    },
  });
}

export async function moderateReview(
  id: string,
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = reviewModerationSchema.parse(raw);
  const current = await prisma.review.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!current) throw new ApiError("Review not found", 404);
  if (current.status !== "PENDING")
    throw new ApiError("Only pending reviews can be moderated", 409);
  const now = new Date();
  const data =
    input.status === "APPROVED"
      ? {
          status: input.status,
          moderatorNotes: input.moderatorNotes,
          approvedBy: actor.id,
          approvedAt: now,
        }
      : {
          status: input.status,
          moderatorNotes: input.moderatorNotes,
          rejectedBy: actor.id,
          rejectedAt: now,
          rejectionReason: input.rejectionReason,
        };
  const result = await prisma.review.updateMany({
    where: { id, status: "PENDING" },
    data,
  });
  if (result.count !== 1)
    throw new ApiError("Review changed; refresh and retry", 409);
  await recordAudit({
    actor,
    action: input.status === "APPROVED" ? "VERIFY" : "REJECT",
    resourceEntity: "Review",
    resourceId: id,
    changes: { oldStatus: current.status, newStatus: input.status },
  });
}
