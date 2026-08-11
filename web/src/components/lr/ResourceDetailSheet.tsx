import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  Pencil,
  School,
  User2,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/lr/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  CHECKLIST_ITEMS,
  countChecked,
  formatDate,
  isChecklistComplete,
  STATUS_CONFIG,
  STATUS_TRANSITIONS,
  type ChecklistItemKey,
  type LearningResource,
  type LRStatus,
} from "@/lib/lr";
import { cn } from "@/lib/utils";

interface ResourceDetailSheetProps {
  resource: LearningResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: LRStatus, remarks: string) => void;
  onToggleChecklistItem: (id: string, itemKey: ChecklistItemKey) => void;
  onEdit: (id: string) => void;
  canUpdate: boolean;
}

export function ResourceDetailSheet({
  resource,
  open,
  onOpenChange,
  onUpdateStatus,
  onToggleChecklistItem,
  onEdit,
  canUpdate,
}: ResourceDetailSheetProps) {
  const [nextStatus, setNextStatus] = useState<LRStatus | null>(null);
  const [remarks, setRemarks] = useState<string>("");

  useEffect(() => {
    setNextStatus(null);
    setRemarks("");
  }, [resource?.id, resource?.status]);

  if (!resource) return null;

  const transitions = STATUS_TRANSITIONS[resource.status];
  const currentConfig = STATUS_CONFIG[resource.status];
  const checkedCount = countChecked(resource.checklistItems);
  const totalItems = resource.checklistItems.length;
  const allChecked = isChecklistComplete(resource.checklistItems);
  const checklistProgress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const handleUpdate = () => {
    if (!nextStatus) return;
    if (nextStatus === "approved" && !allChecked) {
      toast.error("Checklist incomplete", {
        description: "All 8 checklist items must be checked before approving.",
      });
      return;
    }
    onUpdateStatus(resource.id, nextStatus, remarks);
    toast.success(`Status updated to ${STATUS_CONFIG[nextStatus].label}`, {
      description: resource.title,
    });
    setNextStatus(null);
    setRemarks("");
  };

  const handleEditClick = () => {
    onEdit(resource.id);
  };

  const handleToggleItem = (itemKey: ChecklistItemKey) => {
    if (!canUpdate) return;
    onToggleChecklistItem(resource.id, itemKey);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-secondary-foreground">
                {resource.code}
              </span>
              <StatusBadge status={resource.status} />
            </div>
            {canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleEditClick}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          <SheetTitle className="font-display text-xl leading-snug">{resource.title}</SheetTitle>
          <SheetDescription>{currentConfig.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
            <p className="mt-1 font-semibold">{resource.resourceType}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Learning Area
            </p>
            <p className="mt-1 font-semibold">{resource.learningArea}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" /> Grade
            </p>
            <p className="mt-1 font-semibold">
              {resource.gradeLevel} · {resource.quarter}
            </p>
            {resource.week && (
              <p className="mt-0.5 text-xs text-muted-foreground">{resource.week}</p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Submitted
            </p>
            <p className="mt-1 font-semibold">{formatDate(resource.dateSubmitted)}</p>
          </div>
        </div>

        {/* Developer, Position, School & Sub-office */}
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="flex items-center gap-2">
            <User2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{resource.developer}</span>
          </p>
          {resource.position && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <BadgeCheck className="h-4 w-4" />
              {resource.position}
            </p>
          )}
          <p className="flex items-center gap-2 text-muted-foreground">
            <School className="h-4 w-4" />
            {resource.school}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {resource.subOffice}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {resource.division}
          </p>
        </div>

        {/* Checklist Section — shown when status is for-checking */}
        {resource.status === "for-checking" && (
          <>
            <Separator className="my-5" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-display text-base font-semibold">Checking Checklist</h3>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  allChecked
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground",
                )}>
                  {checkedCount} / {totalItems}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    allChecked ? "bg-emerald-500" : "bg-indigo-500",
                  )}
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>

              {/* Checklist items */}
              <ul className="space-y-1.5">
                {resource.checklistItems.map((item, index) => {
                  const Icon = item.checked ? CheckCircle2 : Circle;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        disabled={!canUpdate}
                        onClick={() => handleToggleItem(item.key)}
                        style={{ animationDelay: `${index * 40}ms` }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all animate-rise",
                          canUpdate && "hover:shadow-sm cursor-pointer",
                          !canUpdate && "cursor-default",
                          item.checked
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-border bg-card hover:border-indigo-200",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors",
                            item.checked ? "text-emerald-600" : "text-muted-foreground",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm font-medium leading-snug",
                            item.checked && "text-emerald-900",
                          )}>
                            {item.label}
                          </p>
                          {item.checked && item.date && (
                            <p className="mt-0.5 text-xs text-emerald-600">
                              Completed {formatDate(item.date)}
                            </p>
                          )}
                        </div>
                        {item.checked && (
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            Done
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {!canUpdate && (
                <p className="rounded-lg border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  Only Admin users can update the checklist.
                </p>
              )}

              {canUpdate && !allChecked && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <span className="font-semibold">{totalItems - checkedCount}</span> item{totalItems - checkedCount !== 1 ? "s" : ""} remaining.
                  Complete all checklist items before moving to Approved.
                </div>
              )}

              {allChecked && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All checklist items complete. Ready for approval.
                </div>
              )}
            </div>
          </>
        )}

        <Separator className="my-5" />

        <div>
          <h3 className="font-display text-base font-semibold">Status History</h3>
          <ol className="mt-3 space-y-0">
            {resource.history.map((event, index) => {
              const config = STATUS_CONFIG[event.status];
              const isLast = index === resource.history.length - 1;
              const eventChecked = event.checklistItems
                ? countChecked(event.checklistItems)
                : null;
              return (
                <li
                  key={`${event.status}-${event.date}-${index}`}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {!isLast && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-background shadow-sm",
                      config.dot,
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{event.remarks}</p>
                    {eventChecked !== null && event.status === "for-checking" && (
                      <p className="mt-0.5 text-xs font-medium text-indigo-600">
                        Checklist: {eventChecked} / {event.checklistItems?.length ?? totalItems} items checked
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {canUpdate && transitions.length > 0 && (
          <>
            <Separator className="my-5" />
            <div className="space-y-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
              <h3 className="font-display text-base font-semibold">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {transitions.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isSelected = nextStatus === status;
                  const isApprovalBlocked = status === "approved" && !allChecked;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNextStatus(status)}
                      disabled={isApprovalBlocked}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                        isSelected
                          ? cn(config.badge, "ring-2 ring-ring ring-offset-1")
                          : isApprovalBlocked
                            ? "border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                      {isApprovalBlocked && " (checklist incomplete)"}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs font-medium text-muted-foreground">
                  Remarks (optional)
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. All checklist items verified and complete."
                  rows={2}
                  className="bg-background"
                />
              </div>
              <Button
                onClick={handleUpdate}
                disabled={!nextStatus}
                className="w-full gap-2"
              >
                Apply Status Update
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {!canUpdate && transitions.length > 0 && (
          <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Only Admin users can update or edit learning resources.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
