import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { apiErrorResponse } from "@/lib/http/api-error";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = (await params).token;
    const [alert, member] = await Promise.all([
      prisma.jobAlert.findUnique({
        where: { unsubscribeToken: token },
        select: { id: true },
      }),
      prisma.talentCommunityMember.findUnique({
        where: { unsubscribeToken: token },
        select: { id: true },
      }),
    ]);
    if (alert)
      await prisma.jobAlert.update({
        where: { id: alert.id },
        data: { isActive: false },
      });
    if (member)
      await prisma.talentCommunityMember.update({
        where: { id: member.id },
        data: { status: "UNSUBSCRIBED" },
      });
    return new NextResponse("You have been unsubscribed.", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to process unsubscribe request");
  }
}
