import { randomBytes } from "node:crypto";

import { IntegrationProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { apiErrorResponse } from "@/lib/http/api-error";
import { encryptSecret } from "@/lib/security/secret-encryption";

const connectionSchema = z.object({
  action: z.literal("connection"),
  name: z.string().trim().min(2).max(120),
  provider: z.enum(IntegrationProvider),
  scopes: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
});
const webhookSchema = z.object({
  action: z.literal("webhook"),
  integrationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  name: z.string().trim().min(2).max(120),
  url: z.url(),
  events: z.array(z.string().trim().min(1).max(160)).min(1).max(100),
});
const inputSchema = z.discriminatedUnion("action", [
  connectionSchema,
  webhookSchema,
]);

export async function GET() {
  try {
    await authorizeCollaboration("canManageIntegrations");
    const [connections, webhooks, deadLetters] = await Promise.all([
      prisma.integrationConnection.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          provider: true,
          status: true,
          scopes: true,
          lastCheckedAt: true,
          lastError: true,
          createdAt: true,
          _count: { select: { webhooks: true } },
        },
      }),
      prisma.webhookEndpoint.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          failureCount: true,
          integrationId: true,
          createdAt: true,
        },
      }),
      prisma.webhookDelivery.count({ where: { status: "DEAD_LETTER" } }),
    ]);
    return NextResponse.json({ connections, webhooks, deadLetters });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load integrations");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeCollaboration("canManageIntegrations");
    const input = inputSchema.parse(await request.json());
    if (input.action === "connection") {
      const connection = await prisma.integrationConnection.create({
        data: {
          name: input.name,
          provider: input.provider,
          status: "CONNECTED",
          scopes: input.scopes,
          encryptedConfig: encryptSecret(JSON.stringify(input.config)),
          createdBy: actor.id,
          lastCheckedAt: new Date(),
        },
        select: { id: true, name: true, provider: true, status: true },
      });
      return NextResponse.json({ connection }, { status: 201 });
    }
    const secret = randomBytes(32).toString("base64url");
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        integrationId: input.integrationId ?? null,
        name: input.name,
        url: input.url,
        events: input.events,
        encryptedSecret: encryptSecret(secret),
      },
      select: { id: true, name: true, url: true, events: true },
    });
    return NextResponse.json(
      { webhook, signingSecret: secret },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to create integration");
  }
}
