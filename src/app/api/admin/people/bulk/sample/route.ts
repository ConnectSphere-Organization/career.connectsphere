import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { employeeSampleCsv } from "@/modules/people/server/people";

export async function GET() {
  try {
    await authorizeCollaboration("canManageEmployees");
    return new Response(employeeSampleCsv(), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          "attachment; filename=employee-import-sample.csv",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to download sample");
  }
}
