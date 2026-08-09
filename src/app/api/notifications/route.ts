import { NextResponse } from "next/server";

import { getCollaborationActor } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  listNotifications,
  markAllNotificationsRead,
} from "@/modules/collaboration/server/notifications";

export async function GET(request: Request) {
  try {
    const actor = await getCollaborationActor();
    if (!actor)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json(
      await listNotifications(
        actor.id,
        new URL(request.url).searchParams.get("unread") === "true",
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to load notifications");
  }
}
export async function PATCH() {
  try {
    const actor = await getCollaborationActor();
    if (!actor)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    const result = await markAllNotificationsRead(actor.id);
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update notifications");
  }
}
