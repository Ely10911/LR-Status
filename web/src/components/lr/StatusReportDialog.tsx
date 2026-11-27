import { useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { STATUS_CONFIG, type LearningResource, type LRStatus } from "@/lib/lr";
import { downloadStatusReportCsv, REPORT_STATUSES } from "@/lib/report";
import { cn } from "@/lib/utils";

interface StatusReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resources: LearningResource[];
}

/** Dialog for downloading a CSV report of LRs by QA status. */
export function StatusReportDialog({ open, onOpenChange, resources }: StatusReportDialogProps) {
  const [selected, setSelected] = useState<LRStatus[]>([...REPORT_STATUSES]);

  const counts = new Map<LRStatus, number>(
    REPORT_STATUSES.map((status) => [
      status,
      resources.filter((r) => r.status === status).length,
    ]),
  );
  const totalSelected = [...selected].reduce((sum, s) => sum + (counts.get(s) ?? 0), 0);

  const toggle = (status: LRStatus, checked: boolean | string) => {
    setSelected((prev) =>
      checked
        ? prev.includes(status)
          ? prev
          : [...prev, status]
        : prev.filter((s) => s !== status),
    );
  };

  const handleDownload = () => {
    if (selected.length === 0) return;
    try {
      const ordered = REPORT_STATUSES.filter((s) => selected.includes(s));
      const filename = downloadStatusReportCsv(resources, ordered);
      toast.success("Report downloaded", { description: filename });
      onOpenChange(false);
    } catch (err) {
      console.error("Report download failed", err);
      toast.error("Failed to generate the report.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            Download Status Report
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Choose which learning resources to include. The report is a CSV file
          that opens in Excel with one row per LR.
        </p>

        <div className="space-y-1 rounded-lg border p-2">
          {REPORT_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <div
                key={status}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`report-status-${status}`}
                  checked={selected.includes(status)}
                  onCheckedChange={(checked) => toggle(status, checked)}
                />
                <Label
                  htmlFor={`report-status-${status}`}
                  className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  <Icon className={cn("h-4 w-4", "text-muted-foreground")} />
                  {config.label}
                </Label>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {counts.get(status) ?? 0}
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleDownload}
            disabled={selected.length === 0}
          >
            <Download className="h-4 w-4" />
            {totalSelected} {totalSelected === 1 ? "LR" : "LRs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
