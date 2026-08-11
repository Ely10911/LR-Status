import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  PackageCheck,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type CertificateRequest,
  type CertificateRequestStatus,
  downloadRequestSlipPDF,
  generateRequestSlipPDF,
} from "@/lib/certificate";
import { formatDate } from "@/lib/lr";
import { cn } from "@/lib/utils";

const ALL = "all";

/** Ordered status flow for display. */
const STATUS_ORDER: CertificateRequestStatus[] = [
  "pending",
  "on-process",
  "for-release",
  "approved",
  "rejected",
];

const STATUS_META: Record<
  CertificateRequestStatus,
  { label: string; chip: string; icon: typeof Clock; description: string }
> = {
  pending: {
    label: "Pending",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
    description: "Your request has been submitted and is awaiting review by LRMS.",
  },
  "on-process": {
    label: "On Process",
    chip: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
    description: "LRMS is currently processing your certificate request.",
  },
  "for-release": {
    label: "For Release",
    chip: "bg-violet-100 text-violet-800 border-violet-200",
    icon: PackageCheck,
    description: "Your certificate is ready and awaiting release/signature by LRMS.",
  },
  approved: {
    label: "Released",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Your certificate has been signed and released by LRMS.",
  },
  rejected: {
    label: "Rejected",
    chip: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    description: "Your request was rejected. Please contact LRMS for details.",
  },
};

interface ViewerCertificateRequestsProps {
  requests: CertificateRequest[];
  viewerEmail: string;
}

export function ViewerCertificateRequests({
  requests,
  viewerEmail,
}: ViewerCertificateRequestsProps) {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<CertificateRequestStatus | typeof ALL>(ALL);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Only show requests submitted by this viewer
  const myRequests = useMemo(
    () => requests.filter((r) => r.requesterEmail.toLowerCase() === viewerEmail.toLowerCase()),
    [requests, viewerEmail],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return myRequests.filter((req) => {
      if (statusFilter !== ALL && req.status !== statusFilter) return false;
      if (!query) return true;
      return (
        req.certName.toLowerCase().includes(query) ||
        (req.certEmail ?? "").toLowerCase().includes(query) ||
        req.resourceTitle.toLowerCase().includes(query) ||
        req.resourceCode.toLowerCase().includes(query) ||
        req.slipNumber.toLowerCase().includes(query)
      );
    });
  }, [myRequests, search, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<CertificateRequestStatus, number> = {
      pending: 0,
      "on-process": 0,
      "for-release": 0,
      approved: 0,
      rejected: 0,
    };
    for (const req of myRequests) {
      if (req.status in map) map[req.status] += 1;
    }
    return map;
  }, [myRequests]);

  const handleDownload = async (req: CertificateRequest) => {
    setDownloadingId(req.id);
    try {
      const doc = await generateRequestSlipPDF({
        slipNumber: req.slipNumber,
        requesterName: req.requesterName,
        requesterEmail: req.requesterEmail,
        resourceCode: req.resourceCode,
        resourceTitle: req.resourceTitle,
        resourceType: req.resourceType,
        certName: req.certName,
        certEmail: req.certEmail,
        certPosition: req.certPosition,
        certSchool: req.certSchool,
        certDate: req.certDate,
        requestedAt: req.requestedAt,
      });
      downloadRequestSlipPDF(doc, `SDO-Batangas-Request-Slip-${req.slipNumber}.pdf`);
      toast.success("Request slip downloaded", {
        description: `${req.slipNumber} for ${req.certName}.`,
      });
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download request slip.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Find the latest request for a status highlight
  const latestRequest = myRequests[0];

  return (
    <section className="mt-6 rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold">My Certificate Requests</h2>
            <p className="text-sm text-muted-foreground">
              Track the status of your certificate requests. The electronic copy is not valid until signed and released by LRMS.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {STATUS_ORDER.map((status) => {
            if (counts[status] === 0) return null;
            return (
              <span
                key={status}
                className={cn("rounded-md border px-2 py-1 font-medium", STATUS_META[status].chip)}
              >
                {STATUS_META[status].label} {counts[status]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Status highlight banner for the most recent request */}
      {latestRequest && (
        <div
          className={cn(
            "flex items-center gap-3 border-b px-5 py-3",
            latestRequest.status === "pending" && "border-amber-200 bg-amber-50",
            latestRequest.status === "on-process" && "border-blue-200 bg-blue-50",
            latestRequest.status === "for-release" && "border-violet-200 bg-violet-50",
            latestRequest.status === "approved" && "border-emerald-200 bg-emerald-50",
            latestRequest.status === "rejected" && "border-red-200 bg-red-50",
          )}
        >
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", STATUS_META[latestRequest.status].chip)}>
            {(() => {
              const Icon = STATUS_META[latestRequest.status].icon;
              return <Icon className={cn("h-5 w-5", latestRequest.status === "on-process" && "animate-spin")} />;
            })()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Latest request {latestRequest.slipNumber} — {STATUS_META[latestRequest.status].label}
            </p>
            <p className="text-xs text-muted-foreground">
              {STATUS_META[latestRequest.status].description}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slip no., name, or resource…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CertificateRequestStatus | typeof ALL)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || statusFilter !== ALL) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatusFilter(ALL);
            }}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="min-w-[130px]">Slip No.</TableHead>
              <TableHead className="min-w-[160px]">Certified Person</TableHead>
              <TableHead className="min-w-[200px]">Resource</TableHead>
              <TableHead className="min-w-[120px]">Date Requested</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="font-display text-base font-semibold">No certificate requests yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click "Request Certificate" to submit a new certificate request.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => (
                <TableRow
                  key={req.id}
                  className={
                    req.status === "pending"
                      ? "bg-amber-50/40"
                      : req.status === "on-process"
                        ? "bg-blue-50/30"
                        : req.status === "for-release"
                          ? "bg-violet-50/30"
                          : undefined
                  }
                >
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {req.slipNumber}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{req.certName}</p>
                    {req.certEmail && (
                      <p className="text-xs text-muted-foreground">{req.certEmail}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{req.certPosition}</p>
                    <p className="text-xs text-muted-foreground">{req.certSchool}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{req.resourceTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.resourceCode} · {req.resourceType}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <p>{formatDate(req.requestedAt)}</p>
                    {req.processedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last update: {formatDate(req.processedAt)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={req.status} />
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(req)}
                          disabled={downloadingId === req.id}
                        >
                          {downloadingId === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Request Slip</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: CertificateRequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", meta.chip)}>
      {meta.label}
    </span>
  );
}
