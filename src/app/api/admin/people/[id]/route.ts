import { NextResponse } from "next/server";

import {
  authorizeCollaboration,
  authorizeSuperAdmin,
} from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { deletePerson, updatePerson } from "@/modules/people/server/people";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body: unknown = await request.json();
    const actor =
      typeof body === "object" &&
      body !== null &&
      "operation" in body &&
      body.operation === "role"
        ? await authorizeSuperAdmin()
        : await authorizeCollaboration("canManageEmployees");
    return NextResponse.json({
      person: await updatePerson((await params).id, body, actor),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update account");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeSuperAdmin();
    await deletePerson((await params).id, actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete account");
  }
}
