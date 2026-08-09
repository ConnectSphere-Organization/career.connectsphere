import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { offerSampleCsv } from "@/modules/documents/server/documents";

export async function GET() {
  try {
    await authorizeRecruitment("canGenerateOfferLetter");
    return new Response(offerSampleCsv(), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=offer-import-sample.csv",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to download sample");
  }
}
