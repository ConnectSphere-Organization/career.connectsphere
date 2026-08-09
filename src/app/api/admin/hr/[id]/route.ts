import { NextResponse } from "next/server";

import { authorizeSuperAdmin } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { revokeHr, updateHr } from "@/modules/people/server/hr";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeSuperAdmin();
    await updateHr((await context.params).id, await request.json(), actor);
    return NextResponse.json({ message: "HR access updated" });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update HR access");
  }
}
export const PUT = PATCH;
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeSuperAdmin();
    await revokeHr((await params).id, actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to revoke HR access");
  }
}
