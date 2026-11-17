import "server-only";

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

type QrData = {
  modules: { size: number; get(row: number, column: number): boolean };
};
type Point = [number, number];

function collectPdf(doc: PDFKit.PDFDocument): Promise<Uint8Array> {
  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });
}

function roundRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  doc
    .moveTo(x + r, y)
    .lineTo(x + width - r, y)
    .quadraticCurveTo(x + width, y, x + width, y + r)
    .lineTo(x + width, y + height - r)
    .quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    .lineTo(x + r, y + height)
    .quadraticCurveTo(x, y + height, x, y + height - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();
}

function fillRounded(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  roundRect(doc, x, y, width, height, radius);
  doc.fill(fill);
}

function formatLegacyDate(value: Date | null | undefined): string {
  return value
    ? value.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
}

const certificateColors = {
  white: "#ffffff",
  bgSubtle: "#f8fafc",
  borderOuter: "#006c49",
  borderInner: "#a7f3d0",
  borderLight: "#e2e8f0",
  primaryGreen: "#006c49",
  primaryHover: "#005a3d",
  primarySoft: "#ecfdf5",
  textBlack: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textLight: "#94a3b8",
} as const;
const certificateWidth = 841.89;
const certificateHeight = 595.28;

function certificateTextCenter(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
) {
  doc.text(text, (certificateWidth - doc.widthOfString(text)) / 2, y, {
    lineBreak: false,
  });
}

function drawVectorBrandIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  roundRect(doc, x, y, width, height, 7);
  doc.fill(certificateColors.primaryGreen);

  doc
    .save()
    .lineWidth(1.8)
    .lineCap("round")
    .lineJoin("round")
    .strokeColor(certificateColors.white);

  const bx = x + 7.5;
  const by = y + 7.5;
  const bw = 19;
  const bh = 14;
  roundRect(doc, bx, by, bw, bh, 3);
  doc.stroke();

  doc
    .moveTo(bx + 3, by + bh)
    .lineTo(bx + 1, by + bh + 4.5)
    .lineTo(bx + 7, by + bh)
    .stroke()
    .restore();
}

function drawCertificateQr(
  doc: PDFKit.PDFDocument,
  url: string,
  x: number,
  y: number,
  size: number,
) {
  const qr = QRCode.create(url, {
    errorCorrectionLevel: "H",
  }) as unknown as QrData;
  const modules = qr.modules.size;
  const pad = size * 0.04;
  const moduleSize = (size - pad * 2) / modules;

  roundRect(doc, x, y, size, size, 8);
  doc.fill(certificateColors.white);
  doc.save();
  roundRect(doc, x, y, size, size, 8);
  doc.lineWidth(1).strokeColor(certificateColors.borderInner).stroke();
  doc.restore();

  const eye = (row: number, column: number) => {
    const cx = x + pad + (column + 3.5) * moduleSize;
    const cy = y + pad + (row + 3.5) * moduleSize;
    doc
      .circle(cx, cy, 3.5 * moduleSize)
      .fill(certificateColors.primaryGreen)
      .circle(cx, cy, 2.5 * moduleSize)
      .fill(certificateColors.white)
      .circle(cx, cy, 1.5 * moduleSize)
      .fill(certificateColors.primaryGreen);
  };

  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      if (!qr.modules.get(row, column)) continue;
      const topLeft = row < 7 && column < 7;
      const topRight = row < 7 && column >= modules - 7;
      const bottomLeft = row >= modules - 7 && column < 7;
      if (topLeft || topRight || bottomLeft) {
        if (row === 0 && column === 0) eye(0, 0);
        if (row === 0 && column === modules - 7) eye(0, modules - 7);
        if (row === modules - 7 && column === 0) eye(modules - 7, 0);
        continue;
      }
      doc
        .circle(
          x + pad + column * moduleSize + moduleSize / 2,
          y + pad + row * moduleSize + moduleSize / 2,
          moduleSize * 0.46,
        )
        .fill(certificateColors.textBlack);
    }
  }

  const bracketLength = 8;
  const bracketPosition = -4;
  (
    [
      [x + bracketPosition, y + bracketPosition, 1, 1],
      [x + size - bracketPosition, y + bracketPosition, -1, 1],
      [x + bracketPosition, y + size - bracketPosition, 1, -1],
      [x + size - bracketPosition, y + size - bracketPosition, -1, -1],
    ] as Array<[number, number, number, number]>
  ).forEach(([cx, cy, dx, dy]) => {
    doc
      .save()
      .lineWidth(1.2)
      .strokeColor(certificateColors.primaryGreen)
      .moveTo(cx, cy)
      .lineTo(cx + dx * bracketLength, cy)
      .stroke()
      .moveTo(cx, cy)
      .lineTo(cx, cy + dy * bracketLength)
      .stroke()
      .restore();
  });
}

function drawCertificateBackground(doc: PDFKit.PDFDocument) {
  const C = certificateColors;
  const W = certificateWidth;
  const H = certificateHeight;

  // Pure white base
  doc.rect(0, 0, W, H).fill(C.white);

  // Subtle clean background grid matching the website hero
  doc.save().lineWidth(0.3).strokeColor(C.borderLight).opacity(0.6);
  for (let x = 32; x < W - 32; x += 36) {
    doc.moveTo(x, 24).lineTo(x, H - 24).stroke();
  }
  for (let y = 32; y < H - 32; y += 36) {
    doc.moveTo(24, y).lineTo(W - 24, y).stroke();
  }
  doc.restore();

  // Outer primary green frame
  doc
    .save()
    .rect(18, 18, W - 36, H - 36)
    .lineWidth(2)
    .strokeColor(C.borderOuter)
    .stroke()
    .restore();

  // Inner soft mint frame
  doc
    .save()
    .rect(24, 24, W - 48, H - 48)
    .lineWidth(0.8)
    .strokeColor(C.borderInner)
    .stroke()
    .restore();

  // Corner geometric accents
  const cornerSize = 16;
  const cornerOffset = 18;
  (
    [
      [cornerOffset, cornerOffset, 1, 1],
      [W - cornerOffset, cornerOffset, -1, 1],
      [cornerOffset, H - cornerOffset, 1, -1],
      [W - cornerOffset, H - cornerOffset, -1, -1],
    ] as Array<[number, number, number, number]>
  ).forEach(([cx, cy, dx, dy]) => {
    doc
      .save()
      .lineWidth(2.5)
      .strokeColor(C.borderOuter)
      .moveTo(cx, cy + dy * cornerSize)
      .lineTo(cx, cy)
      .lineTo(cx + dx * cornerSize, cy)
      .stroke()
      .restore();
  });

  // Original logo and brand typography from home page
  const logoPath = path.join(process.cwd(), "public", "brand-logo.png");
  const logoAltPath = path.join(process.cwd(), "public", "logo.png");
  const actualLogo = fs.existsSync(logoPath)
    ? logoPath
    : fs.existsSync(logoAltPath)
      ? logoAltPath
      : null;

  const logoW = 34;
  const logoH = 34;
  const textW = 150;
  const brandX = (W - (logoW + 10 + textW)) / 2;
  const brandY = 36;

  if (actualLogo) {
    try {
      doc.image(actualLogo, brandX, brandY, { width: logoW, height: logoH });
    } catch {
      drawVectorBrandIcon(doc, brandX, brandY, logoW, logoH);
    }
  } else {
    drawVectorBrandIcon(doc, brandX, brandY, logoW, logoH);
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor(C.textBlack)
    .text("ConnectSphere", brandX + logoW + 10, brandY + 2, { lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(C.primaryGreen)
    .text("CAREERS", brandX + logoW + 11, brandY + 23, { lineBreak: false });
}

function certificateSignature(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  name: string,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(certificateColors.textBlack)
    .text(name, x, y - 13, { lineBreak: false, width: 130 });
  doc
    .save()
    .lineWidth(1.2)
    .strokeColor(certificateColors.primaryGreen)
    .moveTo(x, y)
    .lineTo(x + 130, y)
    .stroke()
    .restore()
    .circle(x, y, 2.5)
    .fill(certificateColors.primaryGreen);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(certificateColors.textSubtle)
    .text(label, x, y + 6, { lineBreak: false, width: 130 });
}

export function calculateDuration(from: Date, to: Date): string {
  const ms = Math.abs(to.getTime() - from.getTime());
  const totalDays = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  if (totalDays < 7) {
    return `${totalDays} ${totalDays === 1 ? "Day" : "Days"}`;
  }
  const approxMonths = Math.round(totalDays / 30.44);
  if (approxMonths >= 1 && Math.abs(totalDays - approxMonths * 30.44) <= 5) {
    return `${approxMonths} ${approxMonths === 1 ? "Month" : "Months"}`;
  }
  const weeks = Math.round(totalDays / 7);
  return `${weeks} ${weeks === 1 ? "Week" : "Weeks"}`;
}

export type LegacyCertificatePdfInput = {
  id: string;
  name: string;
  jobrole: string;
  domain: string;
  fromDate: Date;
  toDate: Date;
  verificationUrl: string;
  issuedOn?: Date;
};
export async function renderLegacyCertificatePdf(
  input: LegacyCertificatePdfInput,
): Promise<Uint8Array> {
  const C = certificateColors;
  const W = certificateWidth;
  const H = certificateHeight;
  const doc = new PDFDocument({
    size: [W, H],
    layout: "landscape",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    autoFirstPage: false,
    info: {
      Title: `Internship Certificate - ${input.name}`,
      Author: "ConnectSphere",
      Subject: "Internship Completion Certificate",
    },
  });
  const output = collectPdf(doc);
  doc.addPage({
    size: [W, H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  drawCertificateBackground(doc);

  // Main certificate title
  doc.font("Helvetica-Bold").fontSize(26).fillColor(C.textBlack);
  certificateTextCenter(doc, "INTERNSHIP COMPLETION CERTIFICATE", 112);
  const titleWidth = doc.widthOfString("INTERNSHIP COMPLETION CERTIFICATE");
  doc
    .save()
    .lineWidth(2)
    .strokeColor(C.primaryGreen)
    .moveTo((W - titleWidth) / 2, 145)
    .lineTo((W + titleWidth) / 2, 145)
    .stroke()
    .restore();

  doc.font("Helvetica").fontSize(10).fillColor(C.textSubtle);
  certificateTextCenter(
    doc,
    "Presented by ConnectSphere · connectsphere.in",
    154,
  );

  doc.font("Helvetica").fontSize(12).fillColor(C.textMuted);
  certificateTextCenter(doc, "This is to certify that", 182);

  // Recipient name in bold black text
  doc.font("Helvetica-Bold").fontSize(40).fillColor(C.textBlack);
  certificateTextCenter(doc, input.name, 202);
  const nameWidth = doc.widthOfString(input.name);
  doc
    .save()
    .lineWidth(1.5)
    .strokeColor(C.primaryGreen)
    .moveTo((W - nameWidth - 30) / 2, 250)
    .lineTo((W + nameWidth + 30) / 2, 250)
    .stroke()
    .restore();

  doc.font("Helvetica").fontSize(11).fillColor(C.textMuted);
  certificateTextCenter(
    doc,
    "has successfully completed the internship program in",
    258,
  );

  // Role pill with green styling
  const role = `${input.jobrole}  ·  ${input.domain}`;
  doc.font("Helvetica-Bold").fontSize(12);
  const roleWidth = doc.widthOfString(role);
  const pillX = (W - roleWidth - 40) / 2;
  roundRect(doc, pillX, 276, roleWidth + 40, 26, 13);
  doc.fill(C.primarySoft);
  doc.save();
  roundRect(doc, pillX, 276, roleWidth + 40, 26, 13);
  doc.lineWidth(1).strokeColor(C.primaryGreen).stroke().restore();
  doc.fillColor(C.primaryGreen).text(role, pillX + 20, 283, { lineBreak: false });

  // Starting Date and Duration
  const durationText = calculateDuration(input.fromDate, input.toDate);
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(C.textBlack);
  certificateTextCenter(
    doc,
    `Starting Date :  ${formatLegacyDate(input.fromDate)}        |        Duration :  ${durationText}`,
    322,
  );

  doc.font("Helvetica").fontSize(9).fillColor(C.textSubtle);
  certificateTextCenter(
    doc,
    "in recognition of outstanding commitment, professionalism, and dedication to learning.",
    342,
  );

  // QR Code
  const qrX = 50;
  const qrY = H - 118;
  drawCertificateQr(doc, input.verificationUrl, qrX, qrY, 68);
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(C.textSubtle)
    .text("Scan to verify", qrX, qrY + 76, {
      lineBreak: false,
      width: 68,
      align: "center",
    });

  // Metadata block
  const metaX = 175;
  const metaY = H - 110;
  const displayVerifyAt = input.verificationUrl.replace(/^https?:\/\//, "");
  [
    ["Certificate ID", `ConnectSphere-${input.id}`],
    ["Issued On", formatLegacyDate(input.issuedOn ?? new Date())],
    ["Verify At", displayVerifyAt],
  ].forEach(([label, value], index) => {
    const y = metaY + index * 18;
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.textSubtle)
      .text(`${label} :`, metaX, y, { lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fillColor(C.textBlack)
      .text(value ?? "", metaX + 80, y, {
        lineBreak: false,
        width: 250,
        ellipsis: true,
      });
  });

  doc.rect(metaX - 12, metaY - 2, 2.5, 52).fill(C.primaryGreen);

  certificateSignature(
    doc,
    W - 310,
    metaY + 6,
    "Founder & Director",
    "Anita devi",
  );
  certificateSignature(
    doc,
    W - 160,
    metaY + 6,
    "HR Manager",
    "ConnectSphere Team",
  );

  const verifyHost = input.verificationUrl
    ? input.verificationUrl.replace(/^https?:\/\//, "").split("/")[0]
    : "connectsphere.in";

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(C.textLight)
    .text(
      `This is a digitally issued certificate and is valid without a physical signature. Verify at ${verifyHost}/verify`,
      50,
      H - 32,
      { lineBreak: false, width: W - 100, align: "center" },
    );

  doc.end();
  return output;
}

const offerColors = {
  white: "#ffffff",
  bg: "#fafafa",
  bgAccent: "#f4fac0",
  lime: "#c8e600",
  limeDark: "#8aad00",
  limeBorder: "#daf04a",
  limeDeep: "#4a6800",
  black: "#111111",
  dark: "#1a1a1a",
  mid: "#444444",
  muted: "#777777",
  subtle: "#aaaaaa",
  border: "#ebebeb",
  border2: "#dddddd",
  rowBg: "#f9fdf0",
} as const;
const offerWidth = 595.28;
const offerHeight = 841.89;
const offerPadding = 40;
function strokeRounded(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth = 0.5,
) {
  roundRect(doc, x, y, width, height, radius);
  doc.lineWidth(lineWidth).strokeColor(stroke).stroke();
}
function offerSection(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(offerColors.limeDark)
    .text(text.toUpperCase(), x, y + 1, {
      lineBreak: false,
      characterSpacing: 1.3,
    });
  const textWidth = doc.widthOfString(text.toUpperCase(), {
    characterSpacing: 1.3,
  });
  doc
    .rect(x + textWidth + 8, y + 4, width - textWidth - 8, 0.5)
    .fill(offerColors.border);
}
function drawOfferQr(
  doc: PDFKit.PDFDocument,
  url: string,
  x: number,
  y: number,
  size: number,
) {
  const qr = QRCode.create(url, {
    errorCorrectionLevel: "H",
  }) as unknown as QrData;
  const modules = qr.modules.size;
  const pad = size * 0.07;
  const moduleSize = (size - pad * 2) / modules;
  fillRounded(doc, x, y, size, size, 6, offerColors.bg);
  strokeRounded(doc, x, y, size, size, 6, offerColors.border2);
  for (let row = 0; row < modules; row += 1)
    for (let column = 0; column < modules; column += 1) {
      if (!qr.modules.get(row, column)) continue;
      if (
        (row < 7 && column < 7) ||
        (row < 7 && column >= modules - 7) ||
        (row >= modules - 7 && column < 7)
      )
        continue;
      doc
        .circle(
          x + pad + column * moduleSize + moduleSize / 2,
          y + pad + row * moduleSize + moduleSize / 2,
          moduleSize * 0.41,
        )
        .fill(offerColors.dark);
    }
  (
    [
      [0, 0],
      [0, modules - 7],
      [modules - 7, 0],
    ] as Point[]
  ).forEach(([row, column]) => {
    const cx = x + pad + (column + 3.5) * moduleSize;
    const cy = y + pad + (row + 3.5) * moduleSize;
    doc
      .circle(cx, cy, 3.5 * moduleSize)
      .fill(offerColors.dark)
      .circle(cx, cy, 2.5 * moduleSize)
      .fill(offerColors.white)
      .circle(cx, cy, 1.5 * moduleSize)
      .fill(offerColors.limeDark);
  });
}
function formatCurrency(value: string): string {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-IN") : value;
}

export type LegacyOfferPdfInput = {
  id: string;
  candidateName: string;
  position: string;
  department: string;
  salary: string;
  offerType: string;
  payoutFrequency: string | null;
  startDate: Date;
  endDate: Date | null;
  duration: string | null;
  joiningLocation: string | null;
  workType: string;
  reportingManager: string | null;
  createdAt: Date;
  validUntil: Date;
  extensionCount: number;
  hrContactName: string | null;
  issuedBy: string;
  verificationUrl: string;
};
export async function renderLegacyOfferPdf(
  input: LegacyOfferPdfInput,
): Promise<Uint8Array> {
  const C = offerColors;
  const W = offerWidth;
  const H = offerHeight;
  const PAD = offerPadding;
  const cleanSalary = input.salary
    .replace(/₹/g, "")
    .replace(/\bRs\.?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const internship =
    input.offerType.toLowerCase() === "internship" ||
    input.position.toLowerCase().includes("intern") ||
    cleanSalary === "0" ||
    cleanSalary === "";
  const extended = input.extensionCount > 0;
  const typeLabel = internship ? "Internship" : input.offerType || "Job";
  const salaryLabel = `${internship ? "Stipend" : "Annual CTC"}${internship && input.payoutFrequency ? ` (${input.payoutFrequency})` : ""}`;
  const salary =
    cleanSalary === "0" || cleanSalary === ""
      ? "Unpaid"
      : `Rs. ${formatCurrency(cleanSalary)}`;
  const duration =
    input.duration ||
    (input.endDate
      ? `${formatLegacyDate(input.startDate)} to ${formatLegacyDate(input.endDate)}`
      : "Permanent");
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    autoFirstPage: false,
    info: {
      Title: `Offer Letter — ${input.candidateName}`,
      Author: "ConnectSphere",
      Subject: "Employment Offer Letter",
    },
  });
  const output = collectPdf(doc);
  doc.addPage({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  doc
    .rect(0, 0, W, H)
    .fill(C.white)
    .rect(0, 0, W, 6)
    .fill(C.lime)
    .rect(0, H - 6, W, 6)
    .fill(C.lime)
    .rect(0, 6, W, 58)
    .fill(C.white)
    .rect(0, 63.5, W, 0.5)
    .fill(C.border);
  const logoX = PAD;
  const logoY = 15;
  fillRounded(doc, logoX, logoY + 6, 28, 28, 6, C.lime);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.dark)
    .text("CS", logoX + 7, logoY + 16, { lineBreak: false })
    .fontSize(18)
    .text("ConnectSphere", logoX + 36, logoY + 11, { lineBreak: false });
  const refX = W - PAD - 140;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(C.subtle)
    .text("REFERENCE", refX, 18, { lineBreak: false, characterSpacing: 0.8 })
    .fontSize(9)
    .fillColor(C.mid)
    .text(`ConnectSphere-OFF-${input.id.slice(-6).toUpperCase()}`, refX, 30, {
      lineBreak: false,
    })
    .fontSize(8)
    .fillColor(C.subtle)
    .text(`Issued: ${formatLegacyDate(input.createdAt)}`, refX, 42, {
      lineBreak: false,
    });
  let y = 86;
  const tag = extended ? "OFFER EXTENSION" : "OFFICIAL OFFER LETTER";
  doc.font("Helvetica-Bold").fontSize(7);
  const tagWidth = doc.widthOfString(tag, { characterSpacing: 1.1 }) + 34;
  fillRounded(doc, PAD, y, tagWidth, 18, 9, C.bgAccent);
  strokeRounded(doc, PAD, y, tagWidth, 18, 9, C.limeBorder, 0.75);
  doc
    .circle(PAD + 10, y + 9, 3)
    .fill(C.limeDark)
    .fillColor(C.limeDeep)
    .text(tag, PAD + 18, y + 5.5, { lineBreak: false, characterSpacing: 1.1 });
  y += 26;
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(C.black)
    .text(extended ? "Your Offer Has Been" : "Official Offer.", PAD, y, {
      lineBreak: false,
    });
  y += 30;
  doc
    .fillColor(C.limeDark)
    .text(extended ? "Extended." : "Welcome to ConnectSphere.", PAD, y, {
      lineBreak: false,
    });
  y += 32;
  doc.rect(PAD, y, 36, 3).fill(C.lime);
  y += 20;
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(C.dark)
    .text(`Dear ${input.candidateName},`, PAD, y, { lineBreak: false });
  y += 18;
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(C.muted)
    .lineGap(3)
    .text(
      extended
        ? "We are pleased to inform you that the validity of your offer to join ConnectSphere has been extended. We remain excited about your potential contribution and look forward to welcoming you on board."
        : "We are delighted to extend this formal offer of appointment to join the ConnectSphere family. Your skills and background impressed our team, and we believe you will be a valuable addition to our growing organization.",
      PAD,
      y,
      { width: W - PAD * 2 },
    );
  y += 45;
  fillRounded(doc, PAD, y, W - PAD * 2, 65, 8, C.rowBg);
  doc.rect(PAD, y, 4, 65).fill(C.lime);
  strokeRounded(doc, PAD, y, W - PAD * 2, 65, 8, C.limeBorder, 0.75);
  doc.font("Helvetica-Bold").fontSize(9);
  const badgeWidth = doc.widthOfString(typeLabel.toUpperCase()) + 24;
  const badgeX = W - PAD - badgeWidth - 14;
  fillRounded(doc, badgeX, y + 21.5, badgeWidth, 22, 11, C.bgAccent);
  strokeRounded(doc, badgeX, y + 21.5, badgeWidth, 22, 11, C.limeBorder, 0.75);
  doc
    .fillColor(C.limeDeep)
    .text(typeLabel.toUpperCase(), badgeX + 12, y + 28, { lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(C.subtle)
    .text("POSITION OFFERED", PAD + 16, y + 11, {
      lineBreak: false,
      characterSpacing: 0.8,
    })
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(C.black)
    .text(input.position.toUpperCase(), PAD + 16, y + 24, {
      lineBreak: false,
      width: badgeX - PAD - 26,
      ellipsis: true,
    })
    .font("Helvetica")
    .fontSize(10)
    .fillColor(C.subtle)
    .text(input.department, PAD + 16, y + 44, {
      lineBreak: false,
      width: badgeX - PAD - 26,
      ellipsis: true,
    });
  y += 85;
  offerSection(doc, "Offer Details", PAD, y, W - PAD * 2);
  y += 13;
  const details: Array<[string, string, boolean]> = [
    ["Joining Date", formatLegacyDate(input.startDate), false],
    ["Duration", duration, false],
    [salaryLabel, salary, true],
    ["Work Type", input.workType || "On-site", false],
    ["Location", input.joiningLocation || "—", false],
    ["Reporting To", input.reportingManager || "ConnectSphere Team", false],
  ];
  const gridWidth = W - PAD * 2;
  const cellWidth = gridWidth / 3;
  strokeRounded(doc, PAD, y, gridWidth, 84, 6, C.border);
  for (let column = 1; column < 3; column += 1)
    doc.rect(PAD + column * cellWidth, y, 0.5, 84).fill(C.border);
  doc.rect(PAD, y + 42, gridWidth, 0.5).fill(C.border);
  details.forEach(([label, value, accent], index) => {
    const x = PAD + (index % 3) * cellWidth + 10;
    const cy = y + Math.floor(index / 3) * 42;
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.subtle)
      .text(label.toUpperCase(), x, cy + 8, {
        lineBreak: false,
        characterSpacing: 0.7,
      })
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(accent ? C.limeDark : C.dark)
      .text(value, x, cy + 22, { lineBreak: false, width: cellWidth - 15 });
  });
  y += 109;
  offerSection(doc, "Terms & Expectations", PAD, y, W - PAD * 2);
  y += 16;
  const terms = [
    [
      "Confidentiality",
      "Maintain strict confidentiality of all company data and trade secrets during and after your tenure.",
    ],
    [
      "Code Ownership",
      "All work produced during your tenure remains the exclusive intellectual property of ConnectSphere.",
    ],
    [
      "Professionalism",
      "Adhere to our code of conduct and meet agreed performance standards throughout your role.",
    ],
    [
      "Acceptance",
      "This offer is contingent upon successful background verification and validation of credentials.",
    ],
  ];
  fillRounded(doc, PAD, y, W - PAD * 2, 86, 6, C.bg);
  strokeRounded(doc, PAD, y, W - PAD * 2, 86, 6, C.border);
  terms.forEach(([title, body], index) => {
    const ty = y + 10 + index * 18;
    doc
      .circle(PAD + 13, ty + 4.5, 2.5)
      .fill(C.lime)
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(C.mid)
      .text(`${title}: `, PAD + 21, ty, { lineBreak: false });
    const width = doc.widthOfString(`${title}: `);
    doc
      .font("Helvetica")
      .fillColor(C.muted)
      .text(body ?? "", PAD + 21 + width, ty, {
        lineBreak: false,
        width: W - PAD * 2 - 32 - width,
        ellipsis: true,
      });
  });
  y += 111;
  fillRounded(doc, PAD, y, W - PAD * 2, 65, 8, C.bgAccent);
  strokeRounded(doc, PAD, y, W - PAD * 2, 65, 8, C.limeBorder, 0.75);
  fillRounded(doc, PAD + 12, y + 14.5, 36, 36, 7, C.lime);
  doc
    .save()
    .lineWidth(1.8)
    .strokeColor(C.dark)
    .lineCap("round")
    .lineJoin("round")
    .moveTo(PAD + 22, y + 32.5)
    .lineTo(PAD + 29, y + 39)
    .lineTo(PAD + 42, y + 27)
    .stroke()
    .restore();
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.limeDeep)
    .text("HOW TO ACCEPT", PAD + 62, y + 12, {
      lineBreak: false,
      characterSpacing: 0.9,
    })
    .font("Helvetica")
    .fontSize(10)
    .fillColor(C.muted)
    .text(
      "Confirm via the ConnectSphere portal or reply to this offer email with:",
      PAD + 62,
      y + 26,
      { lineBreak: false },
    )
    .fillColor(C.mid)
    .text(
      '"I accept the offer and agree to the terms and conditions."',
      PAD + 62,
      y + 42,
      { lineBreak: false },
    );
  y += 100;
  doc.rect(PAD, y, W - PAD * 2, 0.5).fill(C.border);
  y += 25;
  drawOfferQr(doc, input.verificationUrl, W / 2 - 30, y, 60);
  doc.font("Helvetica").fontSize(6.5).fillColor(C.subtle);
  const qrLabelWidth = doc.widthOfString("SCAN TO VERIFY", {
    characterSpacing: 0.7,
  });
  doc.text("SCAN TO VERIFY", W / 2 - qrLabelWidth / 2, y + 65, {
    lineBreak: false,
    characterSpacing: 0.7,
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(C.black)
    .text("Anita devi", PAD, y + 14, { lineBreak: false })
    .rect(PAD, y + 32, 120, 0.75)
    .fill(C.border2)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(C.subtle)
    .text("FOUNDER & DIRECTOR", PAD, y + 40, {
      lineBreak: false,
      characterSpacing: 0.5,
    });
  const hr = input.hrContactName?.trim() || input.issuedBy.trim() || "HR Team";
  doc.font("Helvetica-Bold").fontSize(13);
  const hrWidth = doc.widthOfString(hr);
  doc
    .fillColor(C.black)
    .text(hr, W - PAD - hrWidth, y + 14, { lineBreak: false })
    .rect(W - PAD - 120, y + 32, 120, 0.75)
    .fill(C.border2)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(C.subtle);
  const hrRoleWidth = doc.widthOfString("HUMAN RESOURCES", {
    characterSpacing: 0.5,
  });
  doc.text("HUMAN RESOURCES", W - PAD - hrRoleWidth, y + 40, {
    lineBreak: false,
    characterSpacing: 0.5,
  });
  const stripY = H - 28;
  doc
    .rect(0, stripY, W, 22)
    .fill(C.bg)
    .rect(0, stripY, W, 0.5)
    .fill(C.border)
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(C.subtle)
    .text(
      `Digitally issued · Valid without physical signature · Offer Acceptance Deadline: ${formatLegacyDate(input.validUntil)}`,
      PAD,
      stripY + 7,
      { lineBreak: false },
    )
    .font("Helvetica-Bold")
    .fillColor(C.limeDark)
    .text(
      "careers.connectsphere.in",
      W - PAD - doc.widthOfString("careers.connectsphere.in"),
      stripY + 7,
      { lineBreak: false },
    );
  doc.end();
  return output;
}
