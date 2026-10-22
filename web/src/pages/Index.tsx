import { Fragment, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  FileBarChart,
  FileText,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UploadCloud,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AddResourceDialog } from "@/components/lr/AddResourceDialog";
import { SubmitLRDialog } from "@/components/lr/SubmitLRDialog";
import { CertificateRequestDialog } from "@/components/lr/CertificateRequestDialog";
import { CertificateRequestsSection } from "@/components/lr/CertificateRequestsSection";
import { ViewerCertificateRequests } from "@/components/lr/ViewerCertificateRequests";
import { EditResourceDialog } from "@/components/lr/EditResourceDialog";
import { NotificationBell } from "@/components/lr/NotificationBell";
import { ResourceDetailSheet } from "@/components/lr/ResourceDetailSheet";
import { StatusBadge } from "@/components/lr/StatusBadge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useCertificates } from "@/hooks/use-certificates";
import type { EditResourceInput } from "@/hooks/use-resources";
import { useResources } from "@/hooks/use-resources";
import { useVisitors } from "@/hooks/use-visitors";
import {
  formatDate,
  formatDateTime,
  GRADE_LEVELS,
  LEARNING_AREAS,
  STATUS_CONFIG,
  STATUS_ORDER,
  type LearningResource,
  type LRStatus,
} from "@/lib/lr";
import { cn } from "@/lib/utils";
import { SUB_OFFICES } from "@/lib/schools";

const ALL = "all";

/** HSL color values for chart segments, matching STATUS_CONFIG. */
const STATUS_CHART_COLORS: Record<LRStatus, string> = {
  submitted: "hsl(199, 89%, 48%)",
  "for-checking": "hsl(239, 84%, 60%)",
  approved: "hsl(152, 69%, 43%)",
  published: "hsl(173, 80%, 40%)",
  disapproved: "hsl(0, 73%, 51%)",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Preset windows for the date-submitted filter. */
type DatePreset = typeof ALL | "today" | "7d" | "30d" | "90d" | "year" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: ALL, label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

/** Start-of-day helper for inclusive date comparisons. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End-of-day helper for inclusive date comparisons. */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const Index = () => {
  const { resources, addResource, updateStatus, toggleChecklistItem, editResource, resubmitResource, addWriterRemark, removeResource } = useResources();
  const { user, isAdmin, isSubOffice, logout } = useAuth();
  const { visitors, addManualVisitor, removeVisitor } = useVisitors();

  // Group visit entries into unique users and sort by visit count (most frequent first).
  const groupedVisitors = useMemo(() => {
    type VisitorGroup = {
      emailKey: string;
      name: string;
      email: string;
      visits: typeof visitors;
      lastSeen: string;
    };
    const groups = new Map<string, VisitorGroup>();
    for (const v of visitors) {
      const emailKey = v.email.trim().toLowerCase();
      const group = groups.get(emailKey);
      if (group) {
        group.visits.push(v);
        // Keep the display name from the most recent visit.
        if (new Date(v.visitedAt).getTime() >= new Date(group.lastSeen).getTime()) {
          group.lastSeen = v.visitedAt;
          group.name = v.name;
        }
      } else {
        groups.set(emailKey, {
          emailKey,
          name: v.name,
          email: v.email,
          visits: [v],
          lastSeen: v.visitedAt,
        });
      }
    }
    return Array.from(groups.values())
      .map((g) => ({ ...g, count: g.visits.length, lastVisit: g.lastSeen }))
      .sort(
        (a, b) =>
          b.count - a.count || new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime(),
      );
  }, [visitors]);

  const uniqueVisitorCount = groupedVisitors.length;
  const { requests, addRequest, updateRequestStatus, removeRequest, pendingCount } = useCertificates();

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<LRStatus | typeof ALL>(ALL);
  const [areaFilter, setAreaFilter] = useState<string>(ALL);
  const [gradeFilter, setGradeFilter] = useState<string>(ALL);
  const [subOfficeFilter, setSubOfficeFilter] = useState<string>(ALL);
  const [datePreset, setDatePreset] = useState<DatePreset>(ALL);
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  // True when the edit dialog was opened by a viewer to resubmit a disapproved LR.
  const [isResubmit, setIsResubmit] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // Certificate request state
  const [certRequestOpen, setCertRequestOpen] = useState<boolean>(false);

  // Viewer LR submission state
  const [submitLROpen, setSubmitLROpen] = useState<boolean>(false);

  // Visitor log state
  const [visitorOpen, setVisitorOpen] = useState<boolean>(false);
  const [visitorName, setVisitorName] = useState<string>("");
  const [visitorEmail, setVisitorEmail] = useState<string>("");
  const [visitorError, setVisitorError] = useState<string>("");
  const [visitorSearch, setVisitorSearch] = useState<string>("");
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);

  // Viewers only see the learning resources they submitted themselves.
  // Sub-office monitors see every submission from their own sub-office.
  const visibleResources = useMemo(() => {
    if (isAdmin) return resources;
    if (isSubOffice) {
      const office = user?.subOffice?.trim();
      if (!office) return [];
      return resources.filter((r) => r.subOffice === office);
    }
    const email = user?.email?.trim().toLowerCase();
    if (!email) return [];
    return resources.filter(
      (r) => (r.submittedByEmail ?? "").trim().toLowerCase() === email,
    );
  }, [resources, isAdmin, isSubOffice, user]);

  const counts = useMemo(() => {
    const map: Record<LRStatus, number> = {
      submitted: 0,
      "for-checking": 0,
      approved: 0,
      published: 0,
      disapproved: 0,
    };
    for (const resource of visibleResources) map[resource.status] += 1;
    return map;
  }, [visibleResources]);

  const eligibleForCertificate = useMemo(
    () => visibleResources.filter((r) => r.status === "approved" || r.status === "published"),
    [visibleResources],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleResources.filter((resource) => {
      if (statusFilter !== ALL && resource.status !== statusFilter) return false;
      if (areaFilter !== ALL && resource.learningArea !== areaFilter) return false;
      if (gradeFilter !== ALL && resource.gradeLevel !== gradeFilter) return false;
      if (isAdmin && subOfficeFilter !== ALL && resource.subOffice !== subOfficeFilter) {
        return false;
      }
      if (datePreset !== ALL) {
        const submitted = new Date(resource.dateSubmitted);
        if (datePreset === "custom") {
          // Custom range: both bounds optional, inclusive of the whole day.
          if (customDateFrom && submitted < startOfDay(new Date(customDateFrom))) return false;
          if (customDateTo && submitted > endOfDay(new Date(customDateTo))) return false;
        } else if (datePreset === "today") {
          if (submitted < startOfDay(new Date())) return false;
        } else if (datePreset === "year") {
          const now = new Date();
          if (submitted < new Date(now.getFullYear(), 0, 1)) return false;
        } else {
          const days = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : 90;
          const cutoff = startOfDay(new Date());
          cutoff.setDate(cutoff.getDate() - (days - 1));
          if (submitted < cutoff) return false;
        }
      }
      if (!query) return true;
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.developer.toLowerCase().includes(query) ||
        resource.code.toLowerCase().includes(query) ||
        resource.division.toLowerCase().includes(query) ||
        resource.school.toLowerCase().includes(query) ||
        resource.subOffice.toLowerCase().includes(query)
      );
    });
  }, [
    visibleResources,
    search,
    statusFilter,
    areaFilter,
    gradeFilter,
    isAdmin,
    subOfficeFilter,
    datePreset,
    customDateFrom,
    customDateTo,
  ]);

  const hasActiveFilters =
    statusFilter !== ALL ||
    areaFilter !== ALL ||
    gradeFilter !== ALL ||
    (isAdmin && subOfficeFilter !== ALL) ||
    datePreset !== ALL ||
    Boolean(search);

  const clearAllFilters = () => {
    setStatusFilter(ALL);
    setAreaFilter(ALL);
    setGradeFilter(ALL);
    setSubOfficeFilter(ALL);
    setDatePreset(ALL);
    setCustomDateFrom("");
    setCustomDateTo("");
    setSearch("");
  };

  const selected: LearningResource | null =
    resources.find((resource) => resource.id === selectedId) ?? null;

  const editTarget: LearningResource | null =
    resources.find((resource) => resource.id === editTargetId) ?? null;

  const total = visibleResources.length;

  // ---- Report summary data ----
  const statusPieData = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        name: STATUS_CONFIG[status].label,
        value: counts[status],
        status,
      })).filter((d) => d.value > 0),
    [counts],
  );

  const learningAreaData = useMemo(() => {
    const areaMap = new Map<string, number>();
    for (const r of visibleResources) {
      areaMap.set(r.learningArea, (areaMap.get(r.learningArea) ?? 0) + 1);
    }
    return Array.from(areaMap.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  const resourceTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    for (const r of visibleResources) {
      typeMap.set(r.resourceType, (typeMap.get(r.resourceType) ?? 0) + 1);
    }
    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  const gradeLevelData = useMemo(() => {
    const gradeMap = new Map<string, number>();
    for (const r of visibleResources) {
      gradeMap.set(r.gradeLevel, (gradeMap.get(r.gradeLevel) ?? 0) + 1);
    }
    return Array.from(gradeMap.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  const schoolData = useMemo(() => {
    const schoolMap = new Map<string, number>();
    for (const r of visibleResources) {
      schoolMap.set(r.school, (schoolMap.get(r.school) ?? 0) + 1);
    }
    return Array.from(schoolMap.entries())
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleResources]);

  // Monthly submission trend (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; submitted: number; approved: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({
        label: d.toLocaleDateString("en-PH", { month: "short" }),
        key,
        submitted: 0,
        approved: 0,
      });
    }
    for (const r of visibleResources) {
      const d = new Date(r.dateSubmitted);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((m) => m.key === key);
      if (m) m.submitted += 1;
    }
    for (const r of visibleResources) {
      for (const event of r.history) {
        if (event.status === "approved") {
          const d = new Date(event.date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const m = months.find((m) => m.key === key);
          if (m) m.approved += 1;
        }
      }
    }
    return months;
  }, [visibleResources]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const handleEditFromSheet = (id: string) => {
    setIsResubmit(false);
    setEditTargetId(id);
    setEditOpen(true);
  };

  /** Viewer opens the resubmit flow for their own disapproved LR. */
  const handleResubmit = (resource: LearningResource) => {
    setIsResubmit(true);
    setEditTargetId(resource.id);
    setEditOpen(true);
  };

  const handleEditSubmit = (id: string, input: EditResourceInput) => {
    if (isResubmit) resubmitResource(id, input);
    else editResource(id, input);
  };

  const handleDelete = (resource: LearningResource) => {
    removeResource(resource.id);
    toast.success("Resource removed from the tracker", { description: resource.title });
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
  };

  const handleLogVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorError("");
    const trimmedName = visitorName.trim();
    const trimmedEmail = visitorEmail.trim();
    if (trimmedName.length < 2) {
      setVisitorError("Please enter the visitor's name.");
      return;
    }
    if (!trimmedEmail) {
      setVisitorError("Please enter the visitor's email.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setVisitorError("Please enter a valid email address.");
      return;
    }
    addManualVisitor(trimmedName, trimmedEmail);
    toast.success("Visitor logged", {
      description: `${trimmedName} (${trimmedEmail}) has been recorded.`,
    });
    setVisitorName("");
    setVisitorEmail("");
    setVisitorOpen(false);
  };

  const handleExportVisitors = () => {
    if (visitors.length === 0) {
      toast.info("No visitors to export");
      return;
    }
    const headers = ["Name", "Email", "Date Visited"];
    const rows = visitors.map((v) => [
      `"${v.name}"`,
      v.email,
      formatDateTime(v.visitedAt),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SDO-Batangas-Visitor-Log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Visitor log exported", { description: "CSV file downloaded successfully." });
  };

  const filteredVisitors = useMemo(() => {
    const query = visitorSearch.trim().toLowerCase();
    if (!query) return groupedVisitors;
    return groupedVisitors.filter(
      (v) => v.name.toLowerCase().includes(query) || v.email.toLowerCase().includes(query),
    );
  }, [groupedVisitors, visitorSearch]);

  const handleExportReport = () => {
    const headers = [
      "LR Code",
      "Title",
      "Type",
      "Learning Area",
      "Grade Level",
      "Term",
      "Week",
      "Developer",
      "Position",
      "School",
      "Sub-Office",
      "Division",
      "Additional Authors",
      "Date Submitted",
      "Status",
    ];
    const rows = visibleResources.map((r) => [
      r.code,
      `"${r.title}"`,
      r.resourceType,
      r.learningArea,
      r.gradeLevel,
      r.quarter,
      r.week,
      r.developer,
      r.position,
      `"${r.school}"`,
      `"${r.subOffice}"`,
      r.division,
      `"${(r.additionalAuthors ?? []).map((a) => a.name).join("; ")}"`,
      formatDate(r.dateSubmitted),
      STATUS_CONFIG[r.status].label,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SDO-Batangas-LR-Report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: "CSV file downloaded successfully." });
  };

  // Summary statistics
  const approvedCount = counts.approved + counts.published;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
  const inProgressCount = counts.submitted + counts["for-checking"];
  const completionRate = total > 0 ? Math.round((counts.published / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Philippine tricolor accent strip */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[hsl(217,71%,38%)]" />
        <div className="flex-1 bg-[hsl(350,78%,45%)]" />
        <div className="flex-1 bg-[hsl(43,96%,50%)]" />
      </div>

      {/* Header */}
      <header className="header-texture text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {/* SDO Batangas Logo */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/20">
                <img
                  src="/sdo-batangas-logo.png"
                  alt="SDO Batangas Logo"
                  className="h-full w-full rounded-2xl object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".logo-fallback")) {
                      const fallback = document.createElement("div");
                      fallback.className = "logo-fallback flex h-full w-full items-center justify-center rounded-2xl bg-primary text-primary-foreground";
                      fallback.innerHTML = "<svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>";
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Department of Education · LRMDS
                </p>
                <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">
                  SDO Batangas Learning Resource Tracker
                </h1>
                <p className="mt-1 max-w-md text-sm text-primary-foreground/70">
                  Monitor the quality assurance status of DepEd-developed learning
                  resources.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Open visitor log"
                      onClick={() => {
                        const el = document.getElementById("visitor-log-section");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20"
                    >
                      <Users className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Visitor Log</TooltipContent>
                </Tooltip>
              )}
              <NotificationBell />
              {/* User badge */}
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-primary-foreground">
                  {user?.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-primary-foreground/60">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="h-3 w-3 text-accent" /> Admin
                    </>
                  ) : isSubOffice ? (
                    <>
                      <Building2 className="h-3 w-3 text-accent" /> Sub-Office
                    </>
                  ) : (
                    "Viewer"
                  )}
                </span>
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <div className="relative">
                      <Button
                        onClick={() => {
                          const el = document.getElementById("cert-requests-section");
                          el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        size="lg"
                        variant="outline"
                        className="gap-2 border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20"
                      >
                        <Bell className="h-5 w-5" />
                        <span className="hidden sm:inline">Requests</span>
                      </Button>
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white shadow-lg ring-2 ring-primary">
                        {pendingCount}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={() => setAddOpen(true)}
                    size="lg"
                    className="gap-2 bg-accent text-accent-foreground shadow-lg shadow-black/20 hover:bg-accent/90"
                  >
                    <Plus className="h-5 w-5" />
                    Log Resource
                  </Button>
                </div>
              ) : !isSubOffice ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSubmitLROpen(true)}
                    size="lg"
                    className="gap-2 bg-accent text-accent-foreground shadow-lg shadow-black/20 hover:bg-accent/90"
                  >
                    <UploadCloud className="h-5 w-5" />
                    Submit LR
                  </Button>
                  <Button
                    onClick={() => setCertRequestOpen(true)}
                    size="lg"
                    variant="outline"
                    className="gap-2 border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20"
                  >
                    <FileText className="h-5 w-5" />
                    Request Certificate
                  </Button>
                </div>
              ) : null}
              <Button
                onClick={handleLogout}
                size="icon"
                variant="outline"
                className="border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* Viewer banner */}
        {!isAdmin && !isSubOffice && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              You are signed in as a <strong>Viewer</strong>. You can browse your
              submitted learning resources, check their status, and request
              certificates.
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSubmitLROpen(true)}
                size="sm"
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <UploadCloud className="h-4 w-4" />
                Submit LR
              </Button>
              <Button
                onClick={() => setCertRequestOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <FileText className="h-4 w-4" />
                Request Certificate
              </Button>
            </div>
          </div>
        )}

        {/* Sub-office monitor banner */}
        {isSubOffice && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0" />
              You are signed in as a <strong>Sub-Office Monitor</strong>
              {user?.subOffice ? ` for ${user.subOffice}` : ""}. You can monitor
              the submissions of writers within your sub-office.
            </div>
          </div>
        )}

        {/* Status summary tiles */}
        <section className="-mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_ORDER.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(isActive ? ALL : status)}
                style={{ animationDelay: `${index * 55}ms` }}
                className={cn(
                  "animate-rise group rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isActive && cn("ring-2 ring-ring", config.tile),
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-lg p-1.5", config.tileIcon)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {counts[status]}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold">{config.shortLabel}</p>
              </button>
            );
          })}
        </section>

        {/* Distribution bar */}
        {total > 0 && (
          <section className="animate-rise mt-4 rounded-xl border bg-card p-4 shadow-sm" style={{ animationDelay: "440ms" }}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">Pipeline distribution</span>
              <span>{total} resources tracked</span>
            </div>
            <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-muted">
              {STATUS_ORDER.map((status) => {
                const count = counts[status];
                if (count === 0) return null;
                return (
                  <Tooltip key={status}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn("transition-all", STATUS_CONFIG[status].bar)}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {STATUS_CONFIG[status].label}: {count}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        )}

        {/* Report Summary & Charts */}
        <section className="animate-rise mt-6 rounded-xl border bg-card p-5 shadow-sm" style={{ animationDelay: "480ms" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Report Summary</h2>
            </div>
            <Button
              onClick={handleExportReport}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Key metrics row */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Resources</p>
              <p className="font-display mt-1 text-2xl font-bold tabular-nums">{total}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">In Progress</p>
              <p className="font-display mt-1 text-2xl font-bold tabular-nums text-amber-600">{inProgressCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Approval Rate</p>
              <p className="font-display mt-1 text-2xl font-bold tabular-nums text-emerald-600">{approvalRate}%</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="font-display mt-1 text-2xl font-bold tabular-nums text-teal-600">{counts.published}</p>
              <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
            </div>
          </div>

          {/* Charts tabs */}
          <Tabs defaultValue="status" className="mt-5">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="status" className="gap-1.5">
                <FileBarChart className="h-4 w-4" />
                Status
              </TabsTrigger>
              <TabsTrigger value="area" className="gap-1.5">
                <BookOpenCheck className="h-4 w-4" />
                Learning Areas
              </TabsTrigger>
              <TabsTrigger value="grade" className="gap-1.5">
                <BookOpenCheck className="h-4 w-4" />
                Grade Levels
              </TabsTrigger>
              <TabsTrigger value="school" className="gap-1.5">
                <BookOpenCheck className="h-4 w-4" />
                Schools
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Resource Types
              </TabsTrigger>
              <TabsTrigger value="trend" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Monthly Trend
              </TabsTrigger>
            </TabsList>

            {/* Status Distribution - Pie + Bar */}
            <TabsContent value="status" className="mt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Status Breakdown</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        paddingAngle={3}
                        label={(entry) => `${entry.value}`}
                        labelLine={false}
                      >
                        {statusPieData.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
                        ))}
                      </Pie>
                      <RTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Count by Status</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusPieData.map((d) => ({ name: d.name, count: d.value, status: d.status }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <RTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Resources">
                        {statusPieData.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Learning Areas - Horizontal Bar */}
            <TabsContent value="area" className="mt-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">Resources by Learning Area</p>
                <ResponsiveContainer width="100%" height={Math.max(260, learningAreaData.length * 36)}>
                  <BarChart data={learningAreaData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="area"
                      tick={{ fontSize: 11 }}
                      width={130}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(217, 62%, 30%)" radius={[0, 6, 6, 0]} name="Resources" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Grade Levels - Horizontal Bar */}
            <TabsContent value="grade" className="mt-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">Resources by Grade Level</p>
                <ResponsiveContainer width="100%" height={Math.max(260, gradeLevelData.length * 36)}>
                  <BarChart data={gradeLevelData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="grade"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(300, 60%, 40%)" radius={[0, 6, 6, 0]} name="Resources" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Schools - Horizontal Bar */}
            <TabsContent value="school" className="mt-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">Resources by School</p>
                <ResponsiveContainer width="100%" height={Math.max(260, schoolData.length * 36)}>
                  <BarChart data={schoolData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="school"
                      tick={{ fontSize: 10 }}
                      width={180}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(173, 70%, 35%)" radius={[0, 6, 6, 0]} name="Resources" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Resource Types - Bar */}
            <TabsContent value="type" className="mt-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">Resources by Type</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={resourceTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(43, 96%, 45%)" radius={[6, 6, 0, 0]} name="Resources" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Monthly Trend - Line Chart */}
            <TabsContent value="trend" className="mt-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">Submission & Approval Trend (Last 6 Months)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="submitted"
                      stroke="hsl(217, 62%, 30%)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(217, 62%, 30%)" }}
                      name="Submitted"
                    />
                    <Line
                      type="monotone"
                      dataKey="approved"
                      stroke="hsl(152, 69%, 43%)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(152, 69%, 43%)" }}
                      name="Approved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Toolbar */}
        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, code, developer, school, or sub-office…"
              className="bg-card pl-9"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="bg-card sm:w-48">
              <SelectValue placeholder="Learning area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Learning Areas</SelectItem>
              {LEARNING_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="bg-card sm:w-44">
              <SelectValue placeholder="Grade level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Grade Levels</SelectItem>
              {GRADE_LEVELS.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={subOfficeFilter} onValueChange={setSubOfficeFilter}>
              <SelectTrigger className="bg-card sm:w-52">
                <SelectValue placeholder="Sub-office" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Sub-Offices</SelectItem>
                {SUB_OFFICES.map((office) => (
                  <SelectItem key={office} value={office}>
                    {office}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="bg-card sm:w-40">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Date submitted" />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="bg-card sm:w-36"
                aria-label="Submitted from date"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="bg-card sm:w-36"
                aria-label="Submitted to date"
              />
            </div>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground">
              Clear filters
            </Button>
          )}
        </section>

        {/* Resources table */}
        <section className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-[110px]">LR Code</TableHead>
                <TableHead className="min-w-[240px]">Title</TableHead>
                <TableHead className="hidden md:table-cell">Learning Area</TableHead>
                <TableHead className="hidden lg:table-cell">Grade</TableHead>
                <TableHead className="hidden xl:table-cell">School</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <p className="font-display text-lg font-semibold">No resources found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search or filters
                      {isAdmin ? ", or log a new resource." : "."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((resource) => (
                  <TableRow
                    key={resource.id}
                    onClick={() => openDetail(resource.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {resource.code}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold leading-snug">{resource.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {resource.resourceType} · {resource.school}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {resource.subOffice}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {resource.learningArea}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {resource.gradeLevel}
                    </TableCell>
                    <TableCell className="hidden text-sm xl:table-cell">
                      {resource.school}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {formatDate(resource.dateSubmitted)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={resource.status}
                      />
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(resource);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove from tracker</TooltipContent>
                        </Tooltip>
                      ) : !isSubOffice && resource.status === "disapproved" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResubmit(resource);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit & Resubmit</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Click any row to view the full status history
          {isAdmin ? " and apply QA status updates." : "."}
        </p>

        {/* Certificate Requests Section (Admin only) */}
      {isAdmin && (
        <div id="cert-requests-section">
          <CertificateRequestsSection
            requests={requests}
            adminName={user?.name ?? "Admin"}
            onUpdateStatus={updateRequestStatus}
            onRemove={removeRequest}
          />
        </div>
      )}

      {/* My Certificate Requests Section (Viewer only) */}
      {!isAdmin && !isSubOffice && (
        <ViewerCertificateRequests
          requests={requests}
          viewerEmail={user?.email ?? ""}
        />
      )}

      {/* Visitor Log Section (Admin only) */}
        {isAdmin && (
          <section id="visitor-log-section" className="mt-8 scroll-mt-6 rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-lg font-semibold">Visitor Log</h2>
                  <p className="text-sm text-muted-foreground">
                    Track visitors who checked resource statuses.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportVisitors}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={() => setVisitorOpen(true)}
                  size="sm"
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <UserPlus className="h-4 w-4" />
                  Log Visitor
                </Button>
              </div>
            </div>

            {/* Visitor stats */}
            <div className="grid grid-cols-2 gap-3 border-b p-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Visits</p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums">{visitors.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unique Users</p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums text-sky-600">{uniqueVisitorCount}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums text-primary">
                  {visitors.filter((v) => {
                    const today = new Date().toDateString();
                    return new Date(v.visitedAt).toDateString() === today;
                  }).length}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This Month</p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums text-emerald-600">
                  {visitors.filter((v) => {
                    const now = new Date();
                    const d = new Date(v.visitedAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>

            {/* Visitor search */}
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={visitorSearch}
                  onChange={(e) => setVisitorSearch(e.target.value)}
                  placeholder="Search visitors by name or email…"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Visitor table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[220px]">Email</TableHead>
                    <TableHead className="min-w-[160px]">Last Visit</TableHead>
                    <TableHead className="w-24 text-center">Visits</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="font-display text-base font-semibold">No visitors logged</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Viewer sign-ins will appear here, or click "Log Visitor" to add one manually.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVisitors.map((g) => {
                      const isExpanded = expandedVisitor === g.emailKey;
                      const sortedVisits = [...g.visits].sort(
                        (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
                      );
                      return (
                        <Fragment key={g.emailKey}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedVisitor(isExpanded ? null : g.emailKey)}
                        >
                          <TableCell className="font-semibold">
                            <span className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              {g.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {g.email}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(g.lastVisit)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                              {g.count}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    for (const visit of g.visits) removeVisitor(visit.id);
                                    toast.success(
                                      `Removed ${g.count} visit ${g.count === 1 ? "entry" : "entries"} for ${g.name}`,
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove all visits for this user</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={5}>
                              <div className="pl-6">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Visit history — {g.count} {g.count === 1 ? "visit" : "visits"}
                                </p>
                                <ul className="space-y-1.5">
                                  {sortedVisits.map((visit) => (
                                    <li
                                      key={visit.id}
                                      className="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      {formatDateTime(visit.visitedAt)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </main>

      {isAdmin && (
        <AddResourceDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={addResource} />
      )}
      {editTarget && (isAdmin || isResubmit) && (
        <EditResourceDialog
          resource={editTarget}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setIsResubmit(false);
          }}
          onEdit={handleEditSubmit}
          resubmitMode={isResubmit}
        />
      )}
      <ResourceDetailSheet
        resource={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdateStatus={updateStatus}
        onToggleChecklistItem={toggleChecklistItem}
        onEdit={handleEditFromSheet}
        canUpdate={isAdmin}
        onAddWriterRemark={
          !isAdmin && !isSubOffice
            ? (id, remark) => addWriterRemark(id, remark, user?.name ?? "Writer")
            : undefined
        }
      />

      {!isAdmin && (
        <SubmitLRDialog
          open={submitLROpen}
          onOpenChange={setSubmitLROpen}
          onSubmit={addResource}
        />
      )}

      <CertificateRequestDialog
        open={certRequestOpen}
        onOpenChange={setCertRequestOpen}
        onSubmit={addRequest}
        requesterName={user?.name ?? ""}
        requesterEmail={user?.email ?? ""}
        eligibleResources={eligibleForCertificate}
      />

      {/* Log Visitor Dialog (Admin only) */}
      {isAdmin && (
        <Dialog open={visitorOpen} onOpenChange={setVisitorOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Log Visitor
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogVisitor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vName">Visitor Name</Label>
                <Input
                  id="vName"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vEmail">Email Address</Label>
                <Input
                  id="vEmail"
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="e.g. maria.santos@deped.gov.ph"
                />
              </div>
              {visitorError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {visitorError}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVisitorOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="h-4 w-4" />
                  Log Visitor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;
