import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CertificateRequest,
  downloadRequestSlipPDF,
  generateRequestSlipPDF,
} from "@/lib/certificate";
import { formatDate, type LearningResource } from "@/lib/lr";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CertificateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: Omit<CertificateRequest, "id" | "status" | "slipNumber" | "requestedAt">) => CertificateRequest;
  requesterName: string;
  requesterEmail: string;
  eligibleResources: LearningResource[];
}

export function CertificateRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  requesterName,
  requesterEmail,
  eligibleResources,
}: CertificateRequestDialogProps) {
  const [resourceId, setResourceId] = useState<string>("");
  const [certName, setCertName] = useState<string>("");
  const [certEmail, setCertEmail] = useState<string>("");
  const [certPosition, setCertPosition] = useState<string>("");
  const [certSchool, setCertSchool] = useState<string>("");
  const [certDate, setCertDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const selectedResource = useMemo(
    () => eligibleResources.find((r) => r.id === resourceId) ?? null,
    [eligibleResources, resourceId],
  );

  useEffect(() => {
    if (selectedResource) {
      setCertName(selectedResource.developer);
      setCertSchool(selectedResource.school);
    }
  }, [selectedResource]);

  useEffect(() => {
    if (!open) {
      setResourceId("");
      setCertName("");
      setCertEmail("");
      setCertPosition("");
      setCertSchool("");
      setCertDate(new Date().toISOString().split("T")[0]);
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resourceId) {
      setError("Please select a learning resource.");
      return;
    }
    if (!certName.trim()) {
      setError("Please enter the name to be certified.");
      return;
    }
    if (!certEmail.trim() || !EMAIL_REGEX.test(certEmail.trim())) {
      setError("Please enter a valid email address for the person to certify.");
      return;
    }
    if (!certPosition.trim()) {
      setError("Please enter the position/designation.");
      return;
    }
    if (!certSchool.trim()) {
      setError("Please enter the school.");
      return;
    }
    if (!certDate) {
      setError("Please enter the date needed.");
      return;
    }
    if (!EMAIL_REGEX.test(requesterEmail)) {
      setError("Your login email appears invalid. Please sign in again.");
      return;
    }

    const resource = selectedResource!;
    const input: Omit<CertificateRequest, "id" | "status" | "slipNumber" | "requestedAt"> = {
      requesterName,
      requesterEmail,
      resourceId: resource.id,
      resourceCode: resource.code,
      resourceTitle: resource.title,
      resourceType: resource.resourceType,
      certName: certName.trim(),
      certEmail: certEmail.trim(),
      certPosition: certPosition.trim(),
      certSchool: certSchool.trim(),
      certDate,
    };

    setSubmitting(true);
    try {
      const created = onSubmit(input);

      // Generate and download the request slip PDF
      const doc = await generateRequestSlipPDF({
        slipNumber: created.slipNumber,
        requesterName: created.requesterName,
        requesterEmail: created.requesterEmail,
        resourceCode: created.resourceCode,
        resourceTitle: created.resourceTitle,
        resourceType: created.resourceType,
        certName: created.certName,
        certEmail: created.certEmail,
        certPosition: created.certPosition,
        certSchool: created.certSchool,
        certDate: created.certDate,
        requestedAt: created.requestedAt,
      });
      downloadRequestSlipPDF(
        doc,
        `SDO-Batangas-Request-Slip-${created.slipNumber}.pdf`,
      );
      toast.success("Request submitted", {
        description: `Your request slip ${created.slipNumber} has been generated and sent to LRMS for processing.`,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Request slip generation failed", err);
      setError("Failed to generate request slip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Request Certificate of Recognition
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Submit a request for a Certificate of Recognition. A request slip with an
            automatic slip number will be generated. The electronic copy is not valid
            until it is signed and released by the Learning Resource Management Section.
          </p>

          <div className="space-y-2">
            <Label htmlFor="certResource">Select Approved / Published Resource</Label>
            <Select value={resourceId} onValueChange={setResourceId}>
              <SelectTrigger id="certResource" className="bg-card">
                <SelectValue placeholder="Choose a resource" />
              </SelectTrigger>
              <SelectContent>
                {eligibleResources.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No eligible resources available
                  </SelectItem>
                ) : (
                  eligibleResources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} — {r.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="certName">Name to Certify</Label>
              <Input
                id="certName"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="e.g. Maria Elena Santos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certEmail">Email Address</Label>
              <Input
                id="certEmail"
                type="email"
                value={certEmail}
                onChange={(e) => setCertEmail(e.target.value)}
                placeholder="e.g. maria.santos@deped.gov.ph"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="certPosition">Position / Designation</Label>
              <Input
                id="certPosition"
                value={certPosition}
                onChange={(e) => setCertPosition(e.target.value)}
                placeholder="e.g. Teacher III"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certSchool">School</Label>
              <Input
                id="certSchool"
                value={certSchool}
                onChange={(e) => setCertSchool(e.target.value)}
                placeholder="e.g. Batangas City Elementary School"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certDate">Date Needed</Label>
            <Input
              id="certDate"
              type="date"
              value={certDate}
              onChange={(e) => setCertDate(e.target.value)}
            />
          </div>

          {selectedResource && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Resource details</p>
              <p className="text-muted-foreground">
                {selectedResource.resourceType} · {selectedResource.learningArea} · {selectedResource.gradeLevel}
              </p>
              <p className="text-muted-foreground">
                Approved on {formatDate(getApprovedDate(selectedResource))}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getApprovedDate(resource: LearningResource): string {
  const approved = resource.history
    .slice()
    .reverse()
    .find((event) => event.status === "approved" || event.status === "published");
  return approved?.date ?? resource.dateSubmitted;
}
