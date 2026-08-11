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
 * Generate a PDF request slip for certificate of recognition.
 * This replaces the old certificate template with a formal request slip
 * that includes an automatic sequential request slip number.
 */
export async function generateRequestSlipPDF(input: GenerateRequestSlipInput): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - margin * 2;

  // ---- Header band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 8, "F");

  // ---- Logo placeholder (text-based since we removed image template) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text("Republic of the Philippines", centerX, 42, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Department of Education", centerX, 58, { align: "center" });
  doc.text("REGION IV-A CALABARZON", centerX, 72, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("SCHOOLS DIVISION OF BATANGAS", centerX, 88, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Learning Resource Management Section", centerX, 102, { align: "center" });

  // Decorative line under header
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1.5);
  doc.line(margin, 112, pageWidth - margin, 112);
  doc.setLineWidth(0.5);
  doc.line(margin, 116, pageWidth - margin, 116);

  // ---- Request slip banner ----
  doc.setFillColor(245, 248, 252);
  doc.rect(margin, 128, contentWidth, 44, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 51, 102);
  doc.text("REQUEST SLIP", centerX, 156, { align: "center" });

  // ---- Slip number box (top right) ----
  const slipBoxWidth = 200;
  const slipBoxX = pageWidth - margin - slipBoxWidth;
  const slipBoxY = 184;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  doc.rect(slipBoxX, slipBoxY, slipBoxWidth, 40, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Request Slip No.", slipBoxX + 10, slipBoxY + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text(input.slipNumber, slipBoxX + 10, slipBoxY + 30);

  // ---- Date requested (top left) ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Date Requested:", margin, slipBoxY + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(formatDate(input.requestedAt), margin, slipBoxY + 30);

  // ---- Divider ----
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, slipBoxY + 52, pageWidth - margin, slipBoxY + 52);

  // ---- Request details section ----
  let cursorY = slipBoxY + 72;
  const labelX = margin;
  const valueX = margin + 140;
  const rowHeight = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text("REQUEST DETAILS", margin, cursorY);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.75);
  doc.line(margin, cursorY + 4, pageWidth - margin, cursorY + 4);
  cursorY += 22;

  const detailRows: { label: string; value: string }[] = [
    { label: "Requested By:", value: input.requesterName },
    { label: "Email:", value: input.requesterEmail },
    { label: "Date Needed:", value: formatDate(input.certDate) },
  ];

  for (const row of detailRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(row.label, labelX, cursorY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const wrappedValue = doc.splitTextToSize(row.value, contentWidth - 150);
    doc.text(wrappedValue, valueX, cursorY);
    cursorY += rowHeight;
  }

  cursorY += 8;

  // ---- Certificate details section ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text("CERTIFICATE DETAILS", margin, cursorY);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.75);
  doc.line(margin, cursorY + 4, pageWidth - margin, cursorY + 4);
  cursorY += 22;

  const certRows: { label: string; value: string }[] = [
    { label: "Name to Certify:", value: input.certName },
    { label: "Email:", value: input.certEmail },
    { label: "Position:", value: input.certPosition },
    { label: "School:", value: input.certSchool },
    { label: "LR Code:", value: input.resourceCode },
    { label: "Resource Title:", value: input.resourceTitle },
    { label: "Resource Type:", value: input.resourceType },
  ];

  for (const row of certRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(row.label, labelX, cursorY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const wrappedValue = doc.splitTextToSize(row.value, contentWidth - 150);
    doc.text(wrappedValue, valueX, cursorY);
    if (wrappedValue.length > 1) {
      cursorY += rowHeight * wrappedValue.length;
    } else {
      cursorY += rowHeight;
    }
  }

  cursorY += 16;

  // ---- Purpose section ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const purposeText =
    "Purpose: Request for Certificate of Recognition for the above-named individual " +
    "in connection with the Division Quality Assurance of DepEd-Developed Learning Resources.";
  const purposeLines = doc.splitTextToSize(purposeText, contentWidth);
  doc.text(purposeLines, margin, cursorY);
  cursorY += purposeLines.length * 14 + 20;

  // ---- Signature lines ----
  const signY = Math.max(cursorY, pageHeight - 220);

  // Requested by
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.line(margin, signY, margin + 180, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Requested by (Signature over Printed Name)", margin, signY + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(input.requesterName, margin, signY - 4);

  // Received by
  const receivedX = pageWidth - margin - 180;
  doc.setDrawColor(120, 120, 120);
  doc.line(receivedX, signY, receivedX + 180, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Received by (LRMS Personnel)", receivedX, signY + 14);

  // ---- Footer band ----
  const footerY = pageHeight - 56;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY + 3, pageWidth - margin, footerY + 3);

  // ---- Validity note ----
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(160, 40, 40);
  const noteText =
    "NOTE: This electronic copy is not valid until it is signed and released " +
    "by the Learning Resource Management Section.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth);
  doc.text(noteLines, centerX, footerY + 18, { align: "center" });

  // ---- Footer info ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Provincial Sports Complex, Bolbok, 4200 Batangas City", centerX, footerY + 36, { align: "center" });
  doc.text("(043) 722-1840 / 722-1796 / deped.batangas@deped.gov.ph", centerX, footerY + 46, { align: "center" });

  // ---- Bottom border band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

  return doc;
}

export function downloadRequestSlipPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/** Backward-compatible aliases for existing code. */
export const generateCertificatePDF = generateRequestSlipPDF;
export const downloadCertificatePDF = downloadRequestSlipPDF;
export type GenerateCertificateInput = GenerateRequestSlipInput;
