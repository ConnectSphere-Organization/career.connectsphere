import { describe, expect, it } from "vitest";

import {
  developmentTrustedOrigins,
  isAllowedRequestOrigin,
} from "@/lib/http/origin-policy";

describe("request origin policy", () => {
  it("allows equivalent loopback hostnames during development", () => {
    expect(
      isAllowedRequestOrigin({
        origin: "http://127.0.0.1:3001",
        requestOrigin: "http://localhost:3001",
        configuredOrigin: "http://localhost:3001",
        development: true,
      }),
    ).toBe(true);
  });

  it("rejects loopback aliases in production unless exactly configured", () => {
    expect(
      isAllowedRequestOrigin({
        origin: "http://127.0.0.1:3001",
        requestOrigin: "http://localhost:3001",
        configuredOrigin: "http://localhost:3001",
        development: false,
      }),
    ).toBe(false);
  });

  it("rejects different development ports and non-loopback origins", () => {
    expect(
      isAllowedRequestOrigin({
        origin: "http://127.0.0.1:3002",
        requestOrigin: "http://localhost:3001",
        development: true,
      }),
    ).toBe(false);
    expect(
      isAllowedRequestOrigin({
        origin: "https://evil.example",
        requestOrigin: "http://localhost:3001",
        development: true,
      }),
    ).toBe(false);
  });

  it("produces both common loopback origins for Better Auth", () => {
    expect(developmentTrustedOrigins("http://localhost:3001")).toEqual(
      expect.arrayContaining([
        "http://localhost:3001",
        "http://127.0.0.1:3001",
      ]),
    );
  });
});
