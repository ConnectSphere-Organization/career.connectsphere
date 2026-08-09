import { NextResponse } from "next/server";
import {
  ControlledDocumentType,
  TemplateStatus,
  type Prisma,
} from "@prisma/client";
import { z } from "zod";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const templateSchema = z.object({
  id: objectId.optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_:-]{2,80}$/),
  name: z.string().trim().min(2).max(160),
  type: z.enum(ControlledDocumentType),
  version: z.number().int().min(1).max(10_000).default(1),
  locale: z.string().trim().min(2).max(20).default("en-IN"),
  subjectTemplate: z.string().trim().max(300).optional(),
  bodyTemplate: z.string().trim().min(10).max(100_000),
  schema: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(TemplateStatus).default(TemplateStatus.DRAFT),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().optional(),
});

export async function GET() {
  try {
    await authorizeCollaboration("canManageDocuments");
    const templates = await prisma.documentTemplate.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }, { version: "desc" }],
    });
    return NextResponse.json({ templates });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load document templates");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeCollaboration("canManageDocuments");
    const input = templateSchema.parse(await request.json());
    if (
      input.effectiveFrom &&
      input.effectiveUntil &&
      input.effectiveUntil <= input.effectiveFrom
    )
      throw new ApiError("Template effective end must be after start", 400);
    const data = {
      code: input.code,
      name: input.name,
      type: input.type,
      version: input.version,
      locale: input.locale,
      subjectTemplate: input.subjectTemplate ?? null,
      bodyTemplate: input.bodyTemplate,
      schema: input.schema as Prisma.InputJsonValue,
      status: input.status,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
      ...(input.status === "ACTIVE" ? { approvedBy: actor.id } : {}),
    };
    const template = input.id
      ? await updateTemplate(input.id, data)
      : await prisma.documentTemplate.upsert({
          where: { code: input.code },
          create: { ...data, createdBy: actor.id },
          update: data,
        });
    return NextResponse.json({ template }, { status: input.id ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save document template");
  }
}

async function updateTemplate(
  id: string,
  data: Prisma.DocumentTemplateUpdateInput,
) {
  const existing = await prisma.documentTemplate.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError("Document template not found", 404);
  return prisma.documentTemplate.update({ where: { id }, data });
}
