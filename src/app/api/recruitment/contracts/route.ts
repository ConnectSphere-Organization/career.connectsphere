import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listContracts } from "@/modules/contracts/server/contracts";

export async function GET() {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    return NextResponse.json(
      { contracts: await listContracts(actor) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to load contracts");
  }
}
