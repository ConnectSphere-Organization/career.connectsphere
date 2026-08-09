import { createHmac, timingSafeEqual } from "node:crypto";

const tokenVersion = "v1";
const objectIdPattern = /^[a-f\d]{24}$/i;

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOfferResponseToken(
  offerId: string,
  validUntil: Date,
  secret: string,
): string {
  if (!objectIdPattern.test(offerId)) throw new Error("Offer ID is invalid");
  const payload = `${tokenVersion}.${offerId}.${validUntil.getTime()}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function parseOfferResponseToken(
  token: string,
  secret: string,
): { offerId: string; expiresAt: Date } | null {
  const [version, offerId, expiresAtValue, suppliedSignature, ...extra] =
    token.split(".");
  if (
    extra.length ||
    version !== tokenVersion ||
    !objectIdPattern.test(offerId ?? "") ||
    !/^\d{13}$/.test(expiresAtValue ?? "") ||
    !suppliedSignature
  )
    return null;
  const payload = `${version}.${offerId}.${expiresAtValue}`;
  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return null;
  const expiresAt = new Date(Number(expiresAtValue));
  if (Number.isNaN(expiresAt.getTime())) return null;
  return { offerId: offerId!, expiresAt };
}
