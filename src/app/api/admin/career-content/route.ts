import { CareerContentType, PublishStatus, type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { apiErrorResponse } from "@/lib/http/api-error";

const schema = z.object({
  id: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  type: z.enum(CareerContentType),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160),
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(1_000).optional(),
  body: z.record(z.string(), z.unknown()),
  imageUrl: z.url().optional(),
  location: z.string().trim().max(160).optional(),
  order: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(PublishStatus).default(PublishStatus.DRAFT),
});

export async function GET() {
  try {
    await authorizeCollaboration("canManageJobs");
    return NextResponse.json({
      content: await prisma.careerContent.findMany({
        orderBy: [{ type: "asc" }, { order: "asc" }],
      }),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load career content");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeCollaboration("canManageJobs");
    const input = schema.parse(await request.json());
    const data: Prisma.CareerContentUncheckedCreateInput = {
      type: input.type,
      slug: input.slug,
      title: input.title,
      summary: input.summary ?? null,
      body: input.body as Prisma.InputJsonValue,
      imageUrl: input.imageUrl ?? null,
      location: input.location ?? null,
      order: input.order,
      status: input.status,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      createdBy: actor.id,
    };
    const content = input.id
      ? await prisma.careerContent.update({
          where: { id: input.id },
          data: {
            type: input.type,
            slug: input.slug,
            title: input.title,
            summary: input.summary ?? null,
            body: input.body as Prisma.InputJsonValue,
            imageUrl: input.imageUrl ?? null,
            location: input.location ?? null,
            order: input.order,
            status: input.status,
            publishedAt: input.status === "PUBLISHED" ? new Date() : null,
          },
        })
      : await prisma.careerContent.create({ data });
    return NextResponse.json({ content }, { status: input.id ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save career content");
  }
}
