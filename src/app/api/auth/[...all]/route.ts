import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";
import {
  isOAuthCallbackPath,
  normalizeLegacyAuthEnums,
} from "@/lib/auth/legacy-auth-enum-normalization";

const handlers = toNextJsHandler(auth);

async function prepareOAuthCallback(request: Request) {
  if (isOAuthCallbackPath(new URL(request.url).pathname)) {
    await normalizeLegacyAuthEnums();
  }
}

export async function GET(request: Request) {
  await prepareOAuthCallback(request);
  return handlers.GET(request);
}

export async function POST(request: Request) {
  await prepareOAuthCallback(request);
  return handlers.POST(request);
}
