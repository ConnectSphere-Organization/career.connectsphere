import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { CSV_LIMITS } from "@/lib/csv";
import { apiErrorResponse } from "@/lib/http/api-error";
import { bulkIssueCertificates } from "@/modules/documents/server/documents";

export async function POST(request: Request) {
  try {
    const actor = await authorizeRecruitment("canGenerateCertificate");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      return NextResponse.json(
        { message: "CSV file is required" },
        { status: 400 },
      );
    if (file.size > CSV_LIMITS.maxBytes)
      return NextResponse.json(
        { message: `CSV exceeds ${CSV_LIMITS.maxBytes} bytes` },
        { status: 413 },
      );
    return NextResponse.json(
      await bulkIssueCertificates(await file.text(), actor),
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to import certificates");
  }
}
