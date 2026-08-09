import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

function authorized(request: Request): boolean {
  const expected = process.env.METRICS_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request))
    return new Response("Unauthorized\n", { status: 401 });
  const [
    outboxPending,
    outboxFailed,
    webhookDeadLetters,
    pendingPrivacy,
    upcomingInterviews,
  ] = await Promise.all([
    prisma.outboxEvent.count({ where: { status: "PENDING" } }),
    prisma.outboxEvent.count({ where: { status: "FAILED" } }),
    prisma.webhookDelivery.count({ where: { status: "DEAD_LETTER" } }),
    prisma.dataSubjectRequest.count({
      where: { status: { in: ["REQUESTED", "VERIFYING", "IN_PROGRESS"] } },
    }),
    prisma.interviewRound.count({
      where: {
        scheduledStart: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
  ]);
  const lines = [
    "# HELP connectsphere_process_uptime_seconds Process uptime.",
    "# TYPE connectsphere_process_uptime_seconds gauge",
    `connectsphere_process_uptime_seconds ${process.uptime()}`,
    `connectsphere_outbox_pending ${outboxPending}`,
    `connectsphere_outbox_failed ${outboxFailed}`,
    `connectsphere_webhook_dead_letters ${webhookDeadLetters}`,
    `connectsphere_privacy_requests_open ${pendingPrivacy}`,
    `connectsphere_interviews_upcoming ${upcomingInterviews}`,
  ];
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
