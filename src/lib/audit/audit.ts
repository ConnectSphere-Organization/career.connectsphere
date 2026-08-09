import "server-only";

import type { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type AuditActor = { id: string; role: string };

const safeKeys = new Set([
  "status",
  "oldStatus",
  "newStatus",
  "role",
  "oldRole",
  "newRole",
  "permissionKeys",
  "assignedJobCount",
  "reasonProvided",
]);

function safeChanges(
  changes: Readonly<Record<string, Prisma.InputJsonValue>>,
): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(changes).filter(([key]) => safeKeys.has(key)),
  );
}

export async function recordAudit(input: {
  actor: AuditActor;
  action: AuditAction;
  resourceEntity: string;
  resourceId?: string;
  changes?: Readonly<Record<string, Prisma.InputJsonValue>>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actor: input.actor.id,
      actorRole: input.actor.role,
      action: input.action,
      resourceEntity: input.resourceEntity,
      ...(input.resourceId ? { resourceId: input.resourceId } : {}),
      ...(input.changes ? { changes: safeChanges(input.changes) } : {}),
    },
  });
}
