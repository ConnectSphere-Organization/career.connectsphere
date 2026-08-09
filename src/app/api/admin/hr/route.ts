import { NextResponse } from "next/server";

import { authorizeSuperAdmin } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { grantHr, listHrManagement } from "@/modules/people/server/hr";

export async function GET() {
  try {
    await authorizeSuperAdmin();
    return NextResponse.json(await listHrManagement());
  } catch (error) {
    return apiErrorResponse(error, "Unable to load HR management");
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizeSuperAdmin();
    return NextResponse.json(
      { hr: await grantHr(await request.json(), actor) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to grant HR access");
  }
}
