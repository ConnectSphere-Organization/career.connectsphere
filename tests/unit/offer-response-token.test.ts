import { describe, expect, it } from "vitest";

import {
  createOfferResponseToken,
  parseOfferResponseToken,
} from "@/modules/documents/server/offer-response-token";

const secret = "test-secret-that-is-at-least-32-characters";
const offerId = "507f1f77bcf86cd799439011";
const validUntil = new Date("2030-01-05T12:00:00.000Z");

describe("offer response token", () => {
  it("produces the same link token for the same offer validity period", () => {
    expect(createOfferResponseToken(offerId, validUntil, secret)).toBe(
      createOfferResponseToken(offerId, validUntil, secret),
    );
  });

  it("round-trips an authenticated offer and expiry", () => {
    const parsed = parseOfferResponseToken(
      createOfferResponseToken(offerId, validUntil, secret),
      secret,
    );
    expect(parsed).toEqual({ offerId, expiresAt: validUntil });
  });

  it("rejects tampered tokens", () => {
    const token = createOfferResponseToken(offerId, validUntil, secret);
    expect(
      parseOfferResponseToken(`${token.slice(0, -1)}x`, secret),
    ).toBeNull();
  });
});
