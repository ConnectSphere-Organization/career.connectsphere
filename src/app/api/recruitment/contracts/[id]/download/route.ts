import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { contractPdf } from "@/modules/contracts/server/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { id } = await params;
    const pdf = await contractPdf(id, actor);
    return new Response(Buffer.from(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="contract-${id}.pdf"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to generate contract PDF");
  }
}
