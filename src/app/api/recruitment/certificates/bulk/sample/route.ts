import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { certificateSampleCsv } from "@/modules/documents/server/documents";

export async function GET() {
  try {
    await authorizeRecruitment("canGenerateCertificate");
    return new Response(certificateSampleCsv(), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          "attachment; filename=certificate-import-sample.csv",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to download sample");
  }
}
