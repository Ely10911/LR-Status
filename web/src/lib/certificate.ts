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
 * Generate an A5 request slip PDF for certificate of recognition.
 * This replaces the old certificate template with a formal request slip
 * that includes an automatic sequential request slip number.
 */
export async function generateRequestSlipPDF(input: GenerateRequestSlipInput): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a5",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - margin * 2;

  // ---- Header band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 6, "F");

  // ---- Logo placeholder (text-based since we removed image template) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text("Republic of the Philippines", centerX, 28, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Department of Education", centerX, 40, { align: "center" });
  doc.text("REGION IV-A CALABARZON", centerX, 51, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SCHOOLS DIVISION OF BATANGAS", centerX, 63, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Learning Resource Management Section", centerX, 74, { align: "center" });

  // Decorative line under header
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1.2);
  doc.line(margin, 82, pageWidth - margin, 82);
  doc.setLineWidth(0.4);
  doc.line(margin, 85, pageWidth - margin, 85);

  // ---- Request slip banner ----
  doc.setFillColor(245, 248, 252);
  doc.rect(margin, 93, contentWidth, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 51, 102);
  doc.text("REQUEST SLIP", centerX, 112, { align: "center" });

  // ---- Slip number box (top right) ----
  const slipBoxWidth = 136;
  const slipBoxX = pageWidth - margin - slipBoxWidth;
  const slipBoxY = 133;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 255, 255);
  doc.rect(slipBoxX, slipBoxY, slipBoxWidth, 30, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Request Slip No.", slipBoxX + 7, slipBoxY + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 51, 102);
  doc.text(input.slipNumber, slipBoxX + 7, slipBoxY + 24);

  // ---- Date requested (top left) ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("Date Requested:", margin, slipBoxY + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(formatDate(input.requestedAt), margin, slipBoxY + 24);

  // ---- Divider ----
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, slipBoxY + 42, pageWidth - margin, slipBoxY + 42);

  // ---- Request details section ----
  let cursorY = slipBoxY + 56;
  const labelX = margin;
  const valueX = margin + 100;
  const rowHeight = 19;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 51, 102);
  doc.text("REQUEST DETAILS", margin, cursorY);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 3, pageWidth - margin, cursorY + 3);
  cursorY += 16;

  const detailRows: { label: string; value: string }[] = [
    { label: "Requested By:", value: input.requesterName },
    { label: "Email:", value: input.requesterEmail },
    { label: "Date Needed:", value: formatDate(input.certDate) },
  ];

  for (const row of detailRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(row.label, labelX, cursorY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const wrappedValue = doc.splitTextToSize(row.value, contentWidth - 108);
    doc.text(wrappedValue, valueX, cursorY);
    cursorY += rowHeight;
  }

  cursorY += 5;

  // ---- Certificate details section ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 51, 102);
  doc.text("CERTIFICATE DETAILS", margin, cursorY);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY + 3, pageWidth - margin, cursorY + 3);
  cursorY += 16;

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
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(row.label, labelX, cursorY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const wrappedValue = doc.splitTextToSize(row.value, contentWidth - 108);
    doc.text(wrappedValue, valueX, cursorY);
    if (wrappedValue.length > 1) {
      cursorY += rowHeight * wrappedValue.length;
    } else {
      cursorY += rowHeight;
    }
  }

  cursorY += 10;

  // ---- Purpose section ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const purposeText =
    "Purpose: Request for Certificate of Recognition for the above-named individual " +
    "in connection with the Division Quality Assurance of DepEd-Developed Learning Resources.";
  const purposeLines = doc.splitTextToSize(purposeText, contentWidth);
  doc.text(purposeLines, margin, cursorY);
  cursorY += purposeLines.length * 10 + 12;

  // ---- Signature lines ----
  const signY = Math.max(cursorY, pageHeight - 130);

  // Requested by
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(margin, signY, margin + 130, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Requested by (Signature over Printed Name)", margin, signY + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(input.requesterName, margin, signY - 3);

  // Received by
  const receivedX = pageWidth - margin - 130;
  doc.setDrawColor(120, 120, 120);
  doc.line(receivedX, signY, receivedX + 130, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Received by (LRMS Personnel)", receivedX, signY + 10);

  // ---- Footer band ----
  const footerY = pageHeight - 46;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.8);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY + 2, pageWidth - margin, footerY + 2);

  // ---- Validity note ----
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(160, 40, 40);
  const noteText =
    "NOTE: This electronic copy is not valid until it is signed and released " +
    "by the Learning Resource Management Section.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth);
  doc.text(noteLines, centerX, footerY + 12, { align: "center" });

  // ---- Footer info ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Provincial Sports Complex, Bolbok, 4200 Batangas City", centerX, footerY + 25, { align: "center" });
  doc.text("(043) 722-1840 / 722-1796 / deped.batangas@deped.gov.ph", centerX, footerY + 34, { align: "center" });

  // ---- Bottom border band ----
  doc.setFillColor(0, 51, 102);
  doc.rect(0, pageHeight - 5, pageWidth, 5, "F");

  return doc;
}

export function downloadRequestSlipPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/** Backward-compatible aliases for existing code. */
export const generateCertificatePDF = generateRequestSlipPDF;
export const downloadCertificatePDF = downloadRequestSlipPDF;
export type GenerateCertificateInput = GenerateRequestSlipInput;
