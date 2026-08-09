import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({
    status: "ok",
    probe: "liveness",
    service: "connectsphere-career-portal",
    timestamp: new Date().toISOString(),
  });
}
