import { NextResponse } from "next/server";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { bulkPeopleAction, listPeople } from "@/modules/people/server/people";

export async function GET(request: Request) {
  try {
    await authorizeCollaboration("canManageEmployees");
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await listPeople(params));
  } catch (error) {
    return apiErrorResponse(error, "Unable to load people");
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await authorizeCollaboration("canManageEmployees");
    return NextResponse.json(
      await bulkPeopleAction(await request.json(), actor),
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete bulk action");
  }
}
