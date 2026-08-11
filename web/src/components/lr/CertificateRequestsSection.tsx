import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  PackageCheck,
  Search,
  Trash2,
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

/** Ordered status flow for the admin certificate request workflow. */
const STATUS_ORDER: CertificateRequestStatus[] = [
  "pending",
  "on-process",
  "for-release",
  "approved",
  "rejected",
];

const STATUS_META: Record<
  CertificateRequestStatus,
  { label: string; chip: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  "on-process": {
    label: "On Process",
    chip: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
  },
  "for-release": {
    label: "For Release",
    chip: "bg-violet-100 text-violet-800 border-violet-200",
    icon: PackageCheck,
  },
  approved: {
    label: "Approved",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    chip: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

interface CertificateRequestsSectionProps {
  requests: CertificateRequest[];
  adminName: string;
  onUpdateStatus: (id: string, status: CertificateRequestStatus, adminName: string) => void;
  onRemove: (id: string) => void;
}

export function CertificateRequestsSection({
  requests,
  adminName,
  onUpdateStatus,
  onRemove,
}: CertificateRequestsSectionProps) {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<CertificateRequestStatus | typeof ALL>(ALL);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== ALL && req.status !== statusFilter) return false;
      if (!query) return true;
      return (
        req.certName.toLowerCase().includes(query) ||
        (req.certEmail ?? "").toLowerCase().includes(query) ||
        req.requesterName.toLowerCase().includes(query) ||
        req.requesterEmail.toLowerCase().includes(query) ||
        req.resourceTitle.toLowerCase().includes(query) ||
        req.resourceCode.toLowerCase().includes(query) ||
        req.slipNumber.toLowerCase().includes(query)
      );
    });
  }, [requests, search, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<CertificateRequestStatus, number> = {
      pending: 0,
      "on-process": 0,
      "for-release": 0,
      approved: 0,
      rejected: 0,
    };
    for (const req of requests) {
      if (req.status in map) map[req.status] += 1;
    }
    return map;
  }, [requests]);

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

  /** Determine which next-status actions are available for a given status. */
  function getNextActions(status: CertificateRequestStatus): { label: string; next: CertificateRequestStatus; icon: typeof Clock; className: string }[] {
    const actions: { label: string; next: CertificateRequestStatus; icon: typeof Clock; className: string }[] = [];
    if (status === "pending") {
      actions.push({
        label: "Mark On Process",
        next: "on-process",
        icon: Loader2,
        className: "text-blue-600 hover:text-blue-700",
      });
      actions.push({
        label: "Reject",
        next: "rejected",
        icon: XCircle,
        className: "text-red-600 hover:text-red-700",
      });
    } else if (status === "on-process") {
      actions.push({
        label: "Mark For Release",
        next: "for-release",
        icon: PackageCheck,
        className: "text-violet-600 hover:text-violet-700",
      });
      actions.push({
        label: "Reject",
        next: "rejected",
        icon: XCircle,
        className: "text-red-600 hover:text-red-700",
      });
    } else if (status === "for-release") {
      actions.push({
        label: "Approve & Release",
        next: "approved",
        icon: CheckCircle2,
        className: "text-emerald-600 hover:text-emerald-700",
      });
      actions.push({
        label: "Reject",
        next: "rejected",
        icon: XCircle,
        className: "text-red-600 hover:text-red-700",
      });
    }
    return actions;
  }

  return (
    <section className="mt-8 rounded-xl border bg-card shadow-sm">
      {/* Notification banner for pending requests */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {counts.pending} new certificate {counts.pending === 1 ? "request" : "requests"} awaiting your review
            </p>
            <p className="text-xs text-amber-700">
              Review and process the pending requests below.
            </p>
          </div>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-2 text-sm font-bold text-white">
            {counts.pending}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold">Certificate Requests</h2>
            <p className="text-sm text-muted-foreground">
              Viewer requests for certificates of recognition. Request slips are not valid until signed and released by LRMS.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {STATUS_ORDER.map((status) => (
            <span
              key={status}
              className={cn("rounded-md border px-2 py-1 font-medium", STATUS_META[status].chip)}
            >
              {STATUS_META[status].label} {counts[status]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slip no., name, requester, resource, or code…"
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
              <TableHead className="min-w-[160px]">Requested By</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[180px]">Actions</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="font-display text-base font-semibold">No certificate requests</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Viewer requests will appear here once they submit a request.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => {
                const nextActions = getNextActions(req.status);
                return (
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
                    <TableCell className="text-sm">
                      <p>{req.requesterName}</p>
                      <p className="text-xs text-muted-foreground">{req.requesterEmail}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>{formatDate(req.requestedAt)}</p>
                      {req.processedAt && (
                        <p className="text-xs text-muted-foreground">Processed: {formatDate(req.processedAt)}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={req.status} />
                    </TableCell>
                    <TableCell>
                      {nextActions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {nextActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <Tooltip key={action.next}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 gap-1 px-2 text-xs font-medium", action.className)}
                                    onClick={() => {
                                      onUpdateStatus(req.id, action.next, adminName);
                                      toast.success(`${action.label}`, { description: req.slipNumber });
                                    }}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                    {action.label}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{action.label}</TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                onRemove(req.id);
                                toast.success("Request removed");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
