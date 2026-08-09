import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { contractDocumentUrl } from "@/modules/contracts/server/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { id, documentId } = await params;
    return NextResponse.redirect(
      await contractDocumentUrl(id, documentId, actor),
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to access contract document");
  }
}
