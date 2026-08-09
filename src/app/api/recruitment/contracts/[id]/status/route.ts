import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { transitionContractStatus } from "@/modules/contracts/server/contracts";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    return NextResponse.json({
      message: "Contract status updated",
      ...(await transitionContractStatus(
        (await params).id,
        await request.json(),
        actor,
      )),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update contract status");
  }
}
