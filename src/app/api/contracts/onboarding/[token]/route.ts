import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/http/api-error";
import {
  getContractOnboarding,
  saveContractDraft,
  saveContractDraftDocuments,
  submitContract,
} from "@/modules/contracts/server/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    return NextResponse.json(
      { offer: await getContractOnboarding((await params).token) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to load contract onboarding");
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = (await params).token;
    const contentType = request.headers.get("content-type") ?? "";
    const body =
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
        ? await request.formData()
        : await request.json();
    return NextResponse.json(
      {
        message: "Contract submitted securely for HR review",
        contract: await submitContract(token, body, request),
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to submit contract");
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = (await params).token;
    const contentType = request.headers.get("content-type") ?? "";
    const result = contentType.includes("multipart/form-data")
      ? await saveContractDraftDocuments(token, await request.formData())
      : await saveContractDraft(token, await request.json());
    return NextResponse.json(
      { message: "Draft saved", ...result },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to save onboarding draft");
  }
}
