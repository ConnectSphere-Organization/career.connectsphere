import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    service: "connectsphere-career-portal",
    probe: "readiness",
    timestamp: new Date().toISOString(),
  };
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({
      ...base,
      status: "ready",
      dependencies: { database: "ok" },
    });
  } catch {
    return NextResponse.json(
      {
        ...base,
        status: "not_ready",
        dependencies: { database: "unavailable" },
      },
      { status: 503 },
    );
  }
}
