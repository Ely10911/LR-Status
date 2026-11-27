import { countChecked, formatDate, formatDateTime, STATUS_CONFIG, type LearningResource, type LRStatus } from "@/lib/lr";

/** Statuses available in the downloadable status report. */
export const REPORT_STATUSES: LRStatus[] = [
  "for-checking",
  "approved",
  "published",
  "disapproved",
];

const COLUMNS = [
  "Status",
  "LR Code",
  "Title",
  "Resource Type",
  "Learning Area",
  "Grade Level",
  "Quarter",
  "Developer",
  "School",
  "Sub-Office",
  "Date Submitted",
  "Checklist",
  "Latest Update",
  "Latest Remarks",
];

/** Escape a single CSV cell (quotes, commas, newlines). */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Build a CSV report of the learning resources in the given statuses.
 * Opens with a title/summary block, then one row per resource with a
 * Status column. Excel-compatible (CRLF line endings, BOM added at download).
 */
export function buildStatusReportCsv(
  resources: LearningResource[],
  statuses: LRStatus[],
): string {
  const lines: string[] = [];
  lines.push("SDO Batangas Learning Resource Tracker — Status Report");
  lines.push(`Generated: ${formatDateTime(new Date().toISOString())}`);

  const summary = statuses.map(
    (status) => `${STATUS_CONFIG[status].label}: ${resources.filter((r) => r.status === status).length}`,
  );
  summary.push(`Total: ${resources.filter((r) => statuses.includes(r.status)).length}`);
  lines.push(summary.join("  |  "));
  lines.push("");
  lines.push(COLUMNS.map(csvCell).join(","));

  for (const status of statuses) {
    const rows = resources
      .filter((r) => r.status === status)
      .sort((a, b) => a.code.localeCompare(b.code));

    for (const r of rows) {
      const latest = r.history[r.history.length - 1];
      const checklist =
        status === "for-checking" && r.checklistItems.length > 0
          ? `${countChecked(r.checklistItems)}/${r.checklistItems.length}`
          : "";
      const cells = [
        STATUS_CONFIG[status].label,
        r.code,
        r.title,
        r.resourceType,
        r.learningArea,
        r.gradeLevel,
        r.quarter,
        r.developer,
        r.school,
        r.subOffice,
        formatDate(r.dateSubmitted),
        checklist,
        latest ? formatDate(latest.date) : "",
        latest?.remarks ?? "",
      ];
      lines.push(cells.map(csvCell).join(","));
    }
  }

  return lines.join("\r\n");
}

/** Build and download the status report as an Excel-compatible CSV file. */
export function downloadStatusReportCsv(
  resources: LearningResource[],
  statuses: LRStatus[],
): string {
  const csv = buildStatusReportCsv(resources, statuses);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().split("T")[0];
  const scope = statuses.length === REPORT_STATUSES.length ? "all" : statuses.join("-");
  const link = document.createElement("a");
  link.href = url;
  link.download = `SDO-Batangas-LR-Report-${scope}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return link.download;
}
