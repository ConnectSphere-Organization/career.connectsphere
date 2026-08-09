import "server-only";

import type { Prisma } from "@prisma/client";

export type TransactionClient = Prisma.TransactionClient;

export async function enqueueOutbox(
  transaction: TransactionClient,
  event: {
    idempotencyKey: string;
    topic: string;
    aggregateType: string;
    aggregateId: string;
    payload: Prisma.InputJsonValue;
  },
) {
  return transaction.outboxEvent.upsert({
    where: { idempotencyKey: event.idempotencyKey },
    create: event,
    update: {},
  });
}
