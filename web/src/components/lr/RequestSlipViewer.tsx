import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  type CertificateRequest,
  downloadRequestSlipPDF,
  generateRequestSlipPDF,
} from "@/lib/certificate";
import { formatDate } from "@/lib/lr";

interface RequestSlipViewerProps {
  request: CertificateRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * On-screen preview of a certificate request slip, styled to match the
 * printable PDF. Offers Print (browser print of just the slip) and
 * Download PDF (the same file the table's download button produces).
 */
export function RequestSlipViewer({ request, open, onOpenChange }: RequestSlipViewerProps) {
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    if (!request) return;
    setDownloading(true);
    try {
      const doc = await generateRequestSlipPDF({
        slipNumber: request.slipNumber,
        requesterName: request.requesterName,
        requesterEmail: request.requesterEmail,
        resourceCode: request.resourceCode,
        resourceTitle: request.resourceTitle,
        resourceType: request.resourceType,
        certName: request.certName,
        certEmail: request.certEmail,
        certPosition: request.certPosition,
        certSchool: request.certSchool,
        certDate: request.certDate,
        requestedAt: request.requestedAt,
      });
      downloadRequestSlipPDF(doc, `SDO-Batangas-Request-Slip-${request.slipNumber}.pdf`);
      toast.success("Request slip downloaded", {
        description: `${request.slipNumber} for ${request.certName}.`,
      });
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download request slip.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Request Slip {request?.slipNumber}
            </DialogTitle>
          </DialogHeader>

          {request && (
            <>
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/30 p-3">
                <RequestSlipPaper request={request} />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print-only copy of the slip; visible only in @media print output. */}
      {open && request && createPortal(<RequestSlipPaper request={request} print />, document.body)}
    </>
  );
}

/** Letter-shaped paper preview of the slip. `print` renders the print-only copy. */
function RequestSlipPaper({ request, print = false }: { request: CertificateRequest; print?: boolean }) {
  return (
    <div
      id={print ? "request-slip-print-root" : undefined}
      aria-hidden={print || undefined}
      className={
        print
          ? "print-slip-print-only mx-auto bg-white text-black"
          : "mx-auto w-full max-w-[420px] bg-white text-black shadow-md"
      }
    >
      <div className="border-t-4 border-[#003366] px-8 py-6" style={{ borderTopColor: "#003366" }}>
        {/* Header */}
        <div className="text-center">
          <p className="text-base font-bold text-[#003366]">Republic of the Philippines</p>
          <p className="text-[11px] text-black">Department of Education</p>
          <p className="text-[11px] text-black">REGION IV-A CALABARZON</p>
          <p className="text-xs font-bold text-black">SCHOOLS DIVISION OF BATANGAS</p>
          <p className="text-[10px] italic text-neutral-600">Learning Resource Management Section</p>
        </div>
        <div className="mt-2 border-b-2 border-[#003366]" />
        <div className="mt-0.5 border-b border-[#003366]" />

        {/* Banner */}
        <div className="mt-4 rounded-sm bg-[#f5f8fc] py-2 text-center">
          <p className="text-lg font-bold tracking-wide text-[#003366]">REQUEST SLIP</p>
        </div>

        {/* Slip number / date row */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] text-neutral-500">Date Requested:</p>
            <p className="text-sm font-bold">{formatDate(request.requestedAt)}</p>
          </div>
          <div className="rounded-sm border border-[#003366] px-3 py-1.5 text-right">
            <p className="text-[10px] text-neutral-500">Request Slip No.</p>
            <p className="text-sm font-bold text-[#003366]">{request.slipNumber}</p>
          </div>
        </div>

        <div className="mt-4 border-b border-neutral-300" />

        {/* Request details */}
        <SlipSectionTitle>REQUEST DETAILS</SlipSectionTitle>
        <dl className="mt-2 space-y-1.5">
          <SlipRow label="Requested By:" value={request.requesterName} />
          <SlipRow label="Email:" value={request.requesterEmail} />
          <SlipRow label="Date Needed:" value={formatDate(request.certDate)} />
        </dl>

        {/* Certificate details */}
        <div className="mt-4">
          <SlipSectionTitle>CERTIFICATE DETAILS</SlipSectionTitle>
          <dl className="mt-2 space-y-1.5">
            <SlipRow label="Name to Certify:" value={request.certName} />
            <SlipRow label="Email:" value={request.certEmail} />
            <SlipRow label="Position:" value={request.certPosition} />
            <SlipRow label="School:" value={request.certSchool} />
            <SlipRow label="LR Code:" value={request.resourceCode} />
            <SlipRow label="Resource Title:" value={request.resourceTitle} />
            <SlipRow label="Resource Type:" value={request.resourceType} />
          </dl>
        </div>

        {/* Purpose */}
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-700">
          Purpose: Request for Certificate of Recognition for the above-named individual in
          connection with the Division Quality Assurance of DepEd-Developed Learning Resources.
        </p>

        {/* Signatures */}
        <div className="mt-10 flex items-end justify-between">
          <div className="w-[220px]">
            <div className="border-t border-neutral-500" />
            <p className="text-xs font-bold">{request.requesterName}</p>
            <p className="text-[10px] text-neutral-500">Requested by (Signature over Printed Name)</p>
          </div>
          <div className="w-[220px]">
            <div className="border-t border-neutral-500" />
            <p className="text-[10px] text-neutral-500">Received by (LRMS Personnel)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-[#003366]" />
        <p className="mt-2 text-center text-[10px] italic text-[#a02828]">
          NOTE: This electronic copy is not valid until it is signed and released by the
          Learning Resource Management Section.
        </p>
        <p className="mt-2 text-center text-[9px] text-neutral-500">
          Provincial Sports Complex, Bolbok, 4200 Batangas City
        </p>
        <p className="text-center text-[9px] text-neutral-500">
          (043) 722-1840 / 722-1796 / deped.batangas@deped.gov.ph
        </p>
        <div className="mt-2 border-b-4 border-[#003366]" />
      </div>
    </div>
  );
}

function SlipSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-[#003366] pb-0.5 text-xs font-bold text-[#003366]">{children}</p>
  );
}

function SlipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[11px]">
      <dt className="w-36 shrink-0 text-neutral-600">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
