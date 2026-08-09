import { createDecipheriv, createHash, createHmac } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const once = process.argv.includes("--once");
const prefix = "secret:v1";

function encryptionKey() {
  const configured =
    process.env.WEBHOOK_ENCRYPTION_KEY || process.env.CONTRACT_ENCRYPTION_KEY;
  if (!configured) {
    if (process.env.NODE_ENV === "production")
      throw new Error("WEBHOOK_ENCRYPTION_KEY is required");
    return createHash("sha256")
      .update(
        `webhook-encryption:${process.env.BETTER_AUTH_SECRET || "development-only-secret-change-before-deploying"}`,
      )
      .digest();
  }
  const key = Buffer.from(configured, "base64");
  if (key.length !== 32)
    throw new Error("WEBHOOK_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

function decryptSecret(value) {
  const [marker, version, nonce, tag, ciphertext] = value.split(":");
  if (`${marker}:${version}` !== prefix || !nonce || !tag || !ciphertext)
    throw new Error("Invalid encrypted webhook secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(nonce, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function claimOutbox() {
  const event = await prisma.outboxEvent.findFirst({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      availableAt: { lte: new Date() },
      attempts: { lt: 12 },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!event) return false;
  const claimed = await prisma.outboxEvent.updateMany({
    where: { id: event.id, status: event.status, attempts: event.attempts },
    data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null },
  });
  if (claimed.count !== 1) return true;
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event.topic } },
      select: { id: true },
    });
    await Promise.all(
      endpoints.map((endpoint) =>
        prisma.webhookDelivery.upsert({
          where: { eventId: `${event.id}:${endpoint.id}` },
          create: {
            endpointId: endpoint.id,
            eventId: `${event.id}:${endpoint.id}`,
            eventType: event.topic,
            payload: event.payload,
          },
          update: {},
        }),
      ),
    );
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  } catch (error) {
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        lastError: String(error).slice(0, 500),
        availableAt: new Date(
          Date.now() + Math.min(300_000, 1_000 * 2 ** event.attempts),
        ),
      },
    });
  }
  return true;
}

async function deliverWebhook() {
  const delivery = await prisma.webhookDelivery.findFirst({
    where: {
      status: { in: ["PENDING", "RETRY"] },
      nextAttemptAt: { lte: new Date() },
      attempts: { lt: 8 },
    },
    orderBy: { createdAt: "asc" },
    include: { endpoint: true },
  });
  if (!delivery) return false;
  const claimed = await prisma.webhookDelivery.updateMany({
    where: {
      id: delivery.id,
      status: delivery.status,
      attempts: delivery.attempts,
    },
    data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null },
  });
  if (claimed.count !== 1) return true;
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const body = JSON.stringify({
    id: delivery.eventId,
    type: delivery.eventType,
    createdAt: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });
  try {
    const signature = createHmac(
      "sha256",
      decryptSecret(delivery.endpoint.encryptedSecret),
    )
      .update(`${timestamp}.${body}`)
      .digest("hex");
    const response = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "ConnectSphere-Webhooks/1.0",
        "x-connectsphere-timestamp": timestamp,
        "x-connectsphere-signature": `v1=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = (await response.text()).slice(0, 2_000);
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          responseStatus: response.status,
          responseBody,
        },
      }),
      prisma.webhookEndpoint.update({
        where: { id: delivery.endpointId },
        data: { failureCount: 0 },
      }),
    ]);
  } catch (error) {
    const attempts = delivery.attempts + 1;
    const deadLetter = attempts >= 8;
    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: deadLetter ? "DEAD_LETTER" : "RETRY",
          lastError: String(error).slice(0, 500),
          nextAttemptAt: new Date(
            Date.now() + Math.min(3_600_000, 5_000 * 2 ** attempts),
          ),
        },
      }),
      prisma.webhookEndpoint.update({
        where: { id: delivery.endpointId },
        data: { failureCount: { increment: 1 } },
      }),
    ]);
  }
  return true;
}

async function tick() {
  let worked = false;
  for (let index = 0; index < 25; index += 1) {
    const [outbox, webhook] = await Promise.all([
      claimOutbox(),
      deliverWebhook(),
    ]);
    worked ||= outbox || webhook;
    if (!outbox && !webhook) break;
  }
  return worked;
}

try {
  do {
    const worked = await tick();
    if (once) break;
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 5_000));
  } while (true);
} finally {
  await prisma.$disconnect();
}
