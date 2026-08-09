import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

type PdfLine = { label?: string; value: string };

function safePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(value: string, length = 78): string[] {
  const words = safePdfText(value).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > length && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function renderDocumentPdf(
  title: string,
  subtitle: string,
  lines: readonly PdfLine[],
  verificationUrl?: string,
): Promise<Uint8Array> {
  const document = await PDFDocument.create({ updateMetadata: false });
  const stableDate = new Date("2000-01-01T00:00:00.000Z");
  document.setProducer("ConnectSphere Careers");
  document.setCreator("ConnectSphere Careers");
  document.setCreationDate(stableDate);
  document.setModificationDate(stableDate);
  let page = document.addPage([612, 792]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const qrImage = verificationUrl
    ? await document.embedPng(
        await QRCode.toBuffer(verificationUrl, {
          type: "png",
          width: 180,
          margin: 1,
          errorCorrectionLevel: "M",
        }),
      )
    : null;
  let y = 718;
  page.drawRectangle({
    x: 0,
    y: 750,
    width: 612,
    height: 42,
    color: rgb(0.02, 0.35, 0.25),
  });
  page.drawText("ConnectSphere", {
    x: 46,
    y: 765,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(safePdfText(title), {
    x: 46,
    y,
    size: 24,
    font: bold,
    color: rgb(0.05, 0.12, 0.18),
  });
  y -= 27;
  page.drawText(safePdfText(subtitle), {
    x: 46,
    y,
    size: 11,
    font: regular,
    color: rgb(0.35, 0.4, 0.45),
  });
  y -= 36;

  for (const item of lines) {
    const parts = wrap(item.value);
    const requiredHeight = 22 + parts.length * 15;
    if (y - requiredHeight < 55) {
      page = document.addPage([612, 792]);
      y = 735;
    }
    if (item.label) {
      page.drawText(safePdfText(item.label).toUpperCase(), {
        x: 46,
        y,
        size: 9,
        font: bold,
        color: rgb(0.02, 0.45, 0.32),
      });
      y -= 16;
    }
    for (const part of parts) {
      page.drawText(part, {
        x: 46,
        y,
        size: 11,
        font: regular,
        color: rgb(0.12, 0.17, 0.22),
      });
      y -= 15;
    }
    y -= 12;
  }
  if (qrImage) {
    page.drawImage(qrImage, { x: 500, y: 18, width: 66, height: 66 });
    page.drawText("Scan to verify", {
      x: 500,
      y: 9,
      size: 7,
      font: regular,
      color: rgb(0.35, 0.4, 0.45),
    });
  }
  page.drawText(
    "This document can be verified through the official ConnectSphere Careers portal.",
    { x: 46, y: 32, size: 8, font: regular, color: rgb(0.45, 0.48, 0.52) },
  );
  return document.save();
}
