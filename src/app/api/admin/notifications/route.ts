import { NextResponse } from "next/server";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listAdminNotifications } from "@/modules/collaboration/server/notifications";

export async function GET() {
  try {
    await authorizeCollaboration("canManageEmployees");
    return NextResponse.json({ notifications: await listAdminNotifications() });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load notifications");
  }
}
