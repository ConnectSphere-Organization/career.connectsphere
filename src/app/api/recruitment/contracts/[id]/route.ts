import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { getRedactedContract } from "@/modules/contracts/server/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    return NextResponse.json(
      { contract: await getRedactedContract((await params).id, actor) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to load contract");
  }
}
