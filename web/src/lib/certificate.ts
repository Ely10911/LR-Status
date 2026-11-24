import { jsPDF } from "jspdf";

import { formatDate } from "@/lib/lr";

export type CertificateRequestStatus =
  | "pending"
  | "on-process"
  | "for-release"
  | "approved"
  | "rejected";

export interface CertificateRequest {
  id: string;
  /** Name and email of the viewer who submitted the request. */
  requesterName: string;
  requesterEmail: string;
  /** Resource being certified. */
  resourceId: string;
  resourceCode: string;
  resourceTitle: string;
  resourceType: string;
  /** Certificate fields populated from the resource / viewer. */
  certName: string;
  certEmail: string;
  certPosition: string;
  certSchool: string;
  certDate: string;
  /** Tracking and status. */
  status: CertificateRequestStatus;
  /** Sequential request slip number, e.g. RS-2026-0001 */
  slipNumber: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface GenerateRequestSlipInput {
  slipNumber: string;
  requesterName: string;
  requesterEmail: string;
  resourceCode: string;
  resourceTitle: string;
  resourceType: string;
  certName: string;
  certEmail: string;
  certPosition: string;
  certSchool: string;
  certDate: string;
  requestedAt: string;
}

/**
 * Generate a one-page A5 landscape request slip PDF for certificate of
 * recognition. The details are laid out in two columns so everything fits
 * the short page. This replaces the old certificate template with a formal
 * request slip that includes an automatic sequential request slip number.
 */
export async function generateRequestSlipPDF(input: GenerateRequestSlipInput): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a5",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 30;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - margin * 2;

  // ---- Header band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 5, "F");

  // ---- Logo placeholder (text-based since we removed image template) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text("Republic of the Philippines", centerX, 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Department of Education — REGION IV-A CALABARZON", centerX, 32, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("SCHOOLS DIVISION OF BATANGAS", centerX, 43, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("Learning Resource Management Section", centerX, 52, { align: "center" });

  // Decorative line under header
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1.2);
  doc.line(margin, 59, pageWidth - margin, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, 61.5, pageWidth - margin, 61.5);

  // ---- Request slip banner + date + slip number, all on one row ----
  const bannerY = 70;
  const bannerHeight = 22;

  // Banner (left)
  doc.setFillColor(245, 248, 252);
  doc.rect(margin, bannerY, 190, bannerHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text("REQUEST SLIP", margin + 95, bannerY + 15, { align: "center" });

  // Date requested (middle)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Date Requested:", margin + 210, bannerY + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(formatDate(input.requestedAt), margin + 210, bannerY + 18);

  // Slip number box (right)
  const slipBoxWidth = 150;
  const slipBoxX = pageWidth - margin - slipBoxWidth;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 255, 255);
  doc.rect(slipBoxX, bannerY - 2, slipBoxWidth, bannerHeight + 4, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("Request Slip No.", slipBoxX + 7, bannerY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 51, 102);
  doc.text(input.slipNumber, slipBoxX + 7, bannerY + 18);

  // ---- Divider ----
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, bannerY + bannerHeight + 12, pageWidth - margin, bannerY + bannerHeight + 12);

  // ---- Two-column details: request details (left) + certificate details (right) ----
  const sectionsY = bannerY + bannerHeight + 24;
  const rowHeight = 12.5;
  const leftX = margin;
  const leftValueX = leftX + 62;
  const leftWrapWidth = 180;
  const rightX = margin + 272;
  const rightValueX = rightX + 72;
  const rightWrapWidth = contentWidth - 272 - 72;

  const drawSectionTitle = (title: string, x: number, width: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 51, 102);
    doc.text(title, x, sectionsY);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.6);
    doc.line(x, sectionsY + 3, x + width, sectionsY + 3);
  };

  const drawRows = (
    rows: { label: string; value: string }[],
    labelX: number,
    valueX: number,
    wrapWidth: number,
  ): number => {
    let y = sectionsY + 14;
    for (const row of rows) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(row.label, labelX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const wrappedValue = doc.splitTextToSize(row.value, wrapWidth);
      doc.text(wrappedValue, valueX, y);
      y += rowHeight * wrappedValue.length;
    }
    return y;
  };

  // Left column: request details
  drawSectionTitle("REQUEST DETAILS", leftX, 250);
  const leftEnd = drawRows(
    [
      { label: "Requested By:", value: input.requesterName },
      { label: "Email:", value: input.requesterEmail },
      { label: "Date Needed:", value: formatDate(input.certDate) },
    ],
    leftX,
    leftValueX,
    leftWrapWidth,
  );

  // Right column: certificate details
  drawSectionTitle("CERTIFICATE DETAILS", rightX, contentWidth - 272);
  const rightEnd = drawRows(
    [
      { label: "Name to Certify:", value: input.certName },
      { label: "Email:", value: input.certEmail },
      { label: "Position:", value: input.certPosition },
      { label: "School:", value: input.certSchool },
      { label: "LR Code:", value: input.resourceCode },
      { label: "Resource Title:", value: input.resourceTitle },
      { label: "Resource Type:", value: input.resourceType },
    ],
    rightX,
    rightValueX,
    rightWrapWidth,
  );

  // ---- Purpose section (full width, below the columns) ----
  let cursorY = Math.max(leftEnd, rightEnd) + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  const purposeText =
    "Purpose: Request for Certificate of Recognition for the above-named individual " +
    "in connection with the Division Quality Assurance of DepEd-Developed Learning Resources.";
  const purposeLines = doc.splitTextToSize(purposeText, contentWidth);
  doc.text(purposeLines, margin, cursorY);
  cursorY += purposeLines.length * 9 + 10;

  // ---- Signature lines ----
  const signY = Math.max(cursorY, pageHeight - 78);

  // Requested by
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(margin, signY, margin + 140, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text("Requested by (Signature over Printed Name)", margin, signY + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(input.requesterName, margin, signY - 3);

  // Received by
  const receivedX = pageWidth - margin - 140;
  doc.setDrawColor(120, 120, 120);
  doc.line(receivedX, signY, receivedX + 140, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text("Received by (LRMS Personnel)", receivedX, signY + 9);

  // ---- Footer band ----
  const footerY = pageHeight - 34;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.8);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY + 2, pageWidth - margin, footerY + 2);

  // ---- Validity note ----
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(160, 40, 40);
  const noteText =
    "NOTE: This electronic copy is not valid until it is signed and released " +
    "by the Learning Resource Management Section.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth);
  doc.text(noteLines, centerX, footerY + 10, { align: "center" });

  // ---- Footer info ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("Provincial Sports Complex, Bolbok, 4200 Batangas City  ·  (043) 722-1840 / 722-1796  ·  deped.batangas@deped.gov.ph", centerX, footerY + 21, { align: "center" });

  // ---- Bottom border band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  return doc;
}

export function downloadRequestSlipPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/** Backward-compatible aliases for existing code. */
export const generateCertificatePDF = generateRequestSlipPDF;
export const downloadCertificatePDF = downloadRequestSlipPDF;
export type GenerateCertificateInput = GenerateRequestSlipInput;
