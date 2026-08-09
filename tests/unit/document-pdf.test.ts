import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { renderDocumentPdf } from "@/modules/documents/server/pdf";

describe("renderDocumentPdf", () => {
  it("embeds a QR image when a verification URL is supplied", async () => {
    const bytes = await renderDocumentPdf(
      "Certificate",
      "ID: test",
      [{ value: "Safe content" }],
      "https://example.com/verify/test",
    );
    const document = await PDFDocument.load(bytes);
    expect(document.getPages()[0]!.node.Resources()?.toString()).toContain(
      "XObject",
    );
  });
});
