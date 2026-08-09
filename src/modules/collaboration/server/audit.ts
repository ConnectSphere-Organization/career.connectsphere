import "server-only";

import type { AuditAction } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function listAuditLogs(action?: AuditAction) {
  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      actor: true,
      actorRole: true,
      action: true,
      resourceEntity: true,
      resourceId: true,
      createdAt: true,
    },
  });
  const actorIds = [...new Set(logs.map((log) => log.actor))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      })
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));
  return logs.map((log) => ({
    ...log,
    actorUser: actorById.get(log.actor) ?? null,
  }));
}
