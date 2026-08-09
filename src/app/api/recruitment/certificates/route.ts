import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  issueCertificate,
  listCertificates,
} from "@/modules/documents/server/documents";

export async function GET() {
  try {
    const actor = await authorizeRecruitment("canGenerateCertificate");
    return NextResponse.json({ certificates: await listCertificates(actor) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load certificates");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeRecruitment("canGenerateCertificate");
    return NextResponse.json(
      {
        message: "Certificate issued",
        certificate: await issueCertificate(await request.json(), actor),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to issue certificate");
  }
}
