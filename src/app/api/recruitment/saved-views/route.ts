import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const viewSchema = z.object({
  id: objectId.optional(),
  name: z.string().trim().min(2).max(120),
  filters: z.record(z.string(), z.unknown()).default({}),
  columns: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  sort: z.record(z.string(), z.unknown()).optional(),
  isShared: z.boolean().default(false),
});

export async function GET() {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const views = await prisma.savedRecruitingView.findMany({
      where: {
        OR: [{ ownerId: actor.id }, { isShared: true }],
      },
      orderBy: [{ ownerId: "asc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ views });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load saved recruiting views");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const input = viewSchema.parse(await request.json());
    const data = {
      name: input.name,
      filters: input.filters as Prisma.InputJsonValue,
      columns: input.columns,
      sort: (input.sort ?? null) as Prisma.InputJsonValue | null,
      isShared: actor.isAdministrator ? input.isShared : false,
    };
    const view = input.id
      ? await updateOwnedView(input.id, actor.id, data)
      : await prisma.savedRecruitingView.upsert({
          where: { ownerId_name: { ownerId: actor.id, name: input.name } },
          create: { ownerId: actor.id, ...data },
          update: data,
        });
    return NextResponse.json({ view }, { status: input.id ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save recruiting view");
  }
}

async function updateOwnedView(
  id: string,
  ownerId: string,
  data: Prisma.SavedRecruitingViewUpdateInput,
) {
  const existing = await prisma.savedRecruitingView.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });
  if (!existing) throw new ApiError("Saved view not found", 404);
  return prisma.savedRecruitingView.update({ where: { id }, data });
}

export async function DELETE(request: Request) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError("id is required", 400);
    await prisma.savedRecruitingView.deleteMany({
      where: { id, ownerId: actor.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete recruiting view");
  }
}
