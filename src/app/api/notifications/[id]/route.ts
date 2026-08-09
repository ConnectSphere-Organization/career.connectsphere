import { NextResponse } from "next/server";

import { authorizeCollaborationActor } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  deleteNotification,
  markNotificationRead,
} from "@/modules/collaboration/server/notifications";

async function actorId() {
  return (await authorizeCollaborationActor()).id;
}
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await markNotificationRead((await params).id, await actorId());
    return NextResponse.json({ message: "Notification read" });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update notification");
  }
}
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await deleteNotification((await params).id, await actorId());
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete notification");
  }
}
