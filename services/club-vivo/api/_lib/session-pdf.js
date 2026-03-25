"use strict";

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function toPdfLine(value) {
  return `(${escapePdfText(value)}) Tj`;
}

function buildPdfTextLines({ tenantId, session }) {
  const activitySummary = Array.isArray(session.activities) && session.activities.length
    ? session.activities
        .slice(0, 5)
        .map((activity, index) => `${index + 1}. ${activity?.title || activity?.name || "Activity"}`)
        .join(" | ")
    : "No activities";

  return [
    "Club Vivo Session Export",
    `Tenant: ${tenantId}`,
    `Session ID: ${session.sessionId}`,
    `Created At: ${session.createdAt || "n/a"}`,
    `Sport: ${session.sport || "n/a"}`,
    `Age Band: ${session.ageBand || "n/a"}`,
    `Duration (min): ${session.durationMin ?? "n/a"}`,
    `Objectives: ${(session.objectiveTags || []).join(", ") || "n/a"}`,
    `Activities: ${activitySummary}`,
  ];
}

function createSessionPdfBuffer({ tenantId, session }) {
  const textLines = buildPdfTextLines({ tenantId, session });

  const contentLines = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
  ];

  textLines.forEach((line, index) => {
    if (index > 0) contentLines.push("0 -18 Td");
    contentLines.push(toPdfLine(line));
  });
  contentLines.push("ET");

  const contentStream = contentLines.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((objectBody, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

module.exports = {
  createSessionPdfBuffer,
};
