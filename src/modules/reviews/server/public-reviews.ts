import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { PublicReview } from "@/modules/reviews/types";

export async function getApprovedReviews(limit = 10): Promise<PublicReview[]> {
  if (!process.env.MONGODB_URI) {
    return [];
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 20),
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        userName: true,
        position: true,
        department: true,
        isAnonymous: true,
      },
    });

    return reviews;
  } catch {
    return [];
  }
}
