export type OfferEmailTemplateInput = {
  candidateName: string;
  position: string;
  companyName: string;
  acceptanceUrl: string;
  validUntil: Date;
  hrContact: { name: string; email: string | null; phone: string | null };
  extended: boolean;
  internship: boolean;
  year?: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function baseTemplate(content: string, title: string, year: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06); }
    .header { background-color: #000000; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; font-weight: 800; }
    .header span { color: #a3c614; }
    .content { padding: 40px; }
    .footer { background-color: #f9fafb; padding: 32px 40px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg,#a3c614 0%,#82a010 100%); color: #000000 !important; text-decoration: none; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0; box-shadow: 0 4px 14px rgba(163,198,20,.39); }
    .highlight-box { background-color: #f0fdf4; border-left: 4px solid #a3c614; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    p { margin-bottom: 16px; } h2 { color: #111827; margin-top: 0; font-size: 22px; font-weight: 700; }
  </style>
</head>
<body><div class="container"><div class="header"><h1>Connect<span>Sphere</span></h1></div><div class="content">${content}</div><div class="footer"><p>&copy; ${year} ConnectSphere. All rights reserved.</p><p>People Operations • ConnectSphere</p><p style="margin-top:10px"><a href="mailto:careers@connectsphere.in" style="color:#2563eb;text-decoration:none">Contact Support</a></p></div></div></body>
</html>`;
}

export function offerEmailSubject(input: OfferEmailTemplateInput): string {
  if (input.extended)
    return `Offer Validity Extended - ${input.position} at ${input.companyName || "ConnectSphere"}`;
  return `${input.internship ? "Internship Offer" : "Job Offer"} - ${input.position} at ${input.companyName || "ConnectSphere"}`;
}

export function renderLegacyOfferEmail(input: OfferEmailTemplateInput): string {
  const name = escapeHtml(input.candidateName);
  const position = escapeHtml(input.position);
  const link = escapeHtml(input.acceptanceUrl);
  const deadline = input.validUntil.toLocaleDateString("en-GB", {
    timeZone: "UTC",
  });
  const hrName = escapeHtml(input.hrContact.name || "HR Team");
  const hrEmail = input.hrContact.email
    ? escapeHtml(input.hrContact.email)
    : null;
  const hrPhone = input.hrContact.phone
    ? escapeHtml(input.hrContact.phone)
    : null;
  const contact = `<div style="background-color:#f8f9fa;padding:24px;border-radius:12px;margin-top:32px;border:1px solid #e5e7eb"><h4 style="margin:0 0 12px;color:#374151">📞 ${input.extended ? "Questions?" : "Have Questions?"}</h4>${input.extended ? "" : '<p style="margin:0 0 8px;color:#6b7280;font-size:14px">Feel free to reach out to our HR team:</p>'}<p style="margin:4px 0;color:#111827"><strong>${input.extended ? "HR Contact" : "Contact"}:</strong> ${hrName}</p>${hrEmail ? `<p style="margin:4px 0;color:#111827"><strong>Email:</strong> ${hrEmail}</p>` : ""}${hrPhone ? `<p style="margin:4px 0;color:#111827"><strong>Phone:</strong> ${hrPhone}</p>` : ""}</div>`;
  if (input.extended)
    return baseTemplate(
      `<h2>Offer Validity Extended</h2><p>Dear ${name},</p><p>We are pleased to inform you that the validity of your offer for the <strong>${position}</strong> position has been extended.</p><div class="highlight-box"><p style="margin:0;color:#166534;font-weight:600">We've updated your offer details. Please find the revised documents attached.</p></div><div style="background-color:#fff7ed;border-left:4px solid #f97316;padding:16px;margin:24px 0;border-radius:0 8px 8px 0"><p style="margin:0;color:#9a3412"><strong>⏰ New Deadline:</strong> The updated deadline to accept this offer is <strong>${deadline}</strong></p></div><p>You can review and accept the updated offer here:</p><div style="text-align:center"><a href="${link}" class="button">View Updated Offer</a></div>${contact}<p>Regards,<br><strong>ConnectSphere Talent Acquisition</strong></p>`,
      "Offer Validity Extended",
      input.year ?? new Date().getFullYear(),
    );
  return baseTemplate(
    `<h2>Congratulations, ${name}!</h2><p>We are pleased to offer you the position of <strong>${position}</strong> at ConnectSphere.</p><p>Our team was impressed with your background, and we believe you will be a great addition to our mission.</p><div class="highlight-box"><p style="margin:0;color:#166534;font-weight:600">Your official offer letter is attached. Please review the details carefully.</p></div><div style="background-color:#fff7ed;border-left:4px solid #f97316;padding:16px;margin:24px 0;border-radius:0 8px 8px 0"><p style="margin:0;color:#9a3412"><strong>⏰ Important:</strong> The deadline to accept this offer is <strong>${deadline}</strong></p></div><p>To accept this offer, please visit our portal:</p><div style="text-align:center"><a href="${link}" class="button">Review & Accept Offer</a></div>${contact}<p>Best Regards,<br><strong>The HR Team @ ConnectSphere</strong></p>`,
    `Offer Letter - ${input.position}`,
    input.year ?? new Date().getFullYear(),
  );
}
