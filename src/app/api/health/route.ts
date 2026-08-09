import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const probe = new URL(request.url).searchParams.get("probe") ?? "readiness";
  const base = {
    service: "connectsphere-career-portal",
    timestamp: new Date().toISOString(),
  };
  if (probe === "liveness")
    return NextResponse.json({ ...base, status: "ok", probe });
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({
      ...base,
      status: "ready",
      probe: "readiness",
      dependencies: { database: "ok" },
    });
  } catch {
    return NextResponse.json(
      {
        ...base,
        status: "not_ready",
        probe: "readiness",
        dependencies: { database: "unavailable" },
      },
      { status: 503 },
    );
  }
}
