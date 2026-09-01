import {
  BadgeCheck,
  ClipboardCheck,
  Globe2,
  Inbox,
  ListChecks,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/** Lifecycle status of a submitted DepEd-developed learning resource. */
export type LRStatus =
  | "submitted"
  | "for-checking"
  | "approved"
  | "published"
  | "disapproved";

/** Checklist item key for the For Checking status. */
export type ChecklistItemKey =
  | "needs-analysis"
  | "content-evaluation"
  | "language-evaluation"
  | "technical-evaluation"
  | "summary-findings"
  | "certificate-qa"
  | "certificate-field-testing"
  | "copy-of-lrs";

export interface ChecklistItem {
  key: ChecklistItemKey;
  label: string;
  checked: boolean;
  date?: string | null;
}

export interface StatusEvent {
  status: LRStatus;
  date: string;
  remarks: string;
  /** Snapshot of checklist items at this history point (for for-checking events). */
  checklistItems?: ChecklistItem[] | null;
}

export type ResourceType =
  | "Self-Learning Module"
  | "Activity Sheet"
  | "Lesson Exemplar"
  | "Video Lesson"
  | "Storybook"
  | "eBook"
  | "Kasaysayan"
  | "Strategic Intervention Materials (SIMs)"
  | "Interactive Resources & Apps";

/** A co-author credited on the resource, with their own office affiliation. */
export interface AdditionalAuthor {
  name: string;
  subOffice: string;
  school: string;
}

export interface LearningResource {
  id: string;
  code: string;
  title: string;
  resourceType: ResourceType;
  learningArea: string;
  gradeLevel: string;
  quarter: string;
  /** Week within the quarter when the resource is used. */
  week: string;
  developer: string;
  /** Position / rank of the developer (e.g. Teacher I, Master Teacher I). */
  position: string;
  /** Co-authors credited on the resource (admin-managed). */
  additionalAuthors: AdditionalAuthor[];
  /** Email of the viewer account that submitted this resource (for the viewer portal). */
  submittedByEmail?: string;
  division: string;
  /** School where the resource was developed. */
  school: string;
  /** Sub-office / unit within SDO Batangas responsible for the resource. */
  subOffice: string;
  dateSubmitted: string;
  status: LRStatus;
  /** Checklist items tracked during the For Checking phase. */
  checklistItems: ChecklistItem[];
  history: StatusEvent[];
}

interface StatusConfig {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  dot: string;
  tile: string;
  tileIcon: string;
  bar: string;
}

export const STATUS_ORDER: LRStatus[] = [
  "submitted",
  "for-checking",
  "approved",
  "published",
  "disapproved",
];

export const STATUS_CONFIG: Record<LRStatus, StatusConfig> = {
  submitted: {
    label: "Submitted",
    shortLabel: "Submitted",
    description: "Received by the LRMDS and awaiting initial document checking.",
    icon: Inbox,
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
    tile: "border-sky-200 bg-sky-50",
    tileIcon: "bg-sky-500/10 text-sky-600",
    bar: "bg-sky-500",
  },
  "for-checking": {
    label: "For Checking",
    shortLabel: "Checking",
    description: "Admin is checking the submitted learning resource and accompanying documents using the QA checklist.",
    icon: ClipboardCheck,
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-500",
    tile: "border-indigo-200 bg-indigo-50",
    tileIcon: "bg-indigo-500/10 text-indigo-600",
    bar: "bg-indigo-500",
  },
  approved: {
    label: "Approved",
    shortLabel: "Approved",
    description: "Passed quality assurance and cleared for publication.",
    icon: BadgeCheck,
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    tile: "border-emerald-200 bg-emerald-50",
    tileIcon: "bg-emerald-500/10 text-emerald-600",
    bar: "bg-emerald-500",
  },
  published: {
    label: "Published",
    shortLabel: "Published",
    description: "Uploaded and available on the DepEd LR Portal.",
    icon: Globe2,
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
    tile: "border-teal-200 bg-teal-50",
    tileIcon: "bg-teal-500/10 text-teal-600",
    bar: "bg-teal-500",
  },
  disapproved: {
    label: "Disapproved",
    shortLabel: "Disapproved",
    description: "Did not meet quality standards; not endorsed for publication.",
    icon: XCircle,
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
    tile: "border-red-200 bg-red-50",
    tileIcon: "bg-red-500/10 text-red-600",
    bar: "bg-red-500",
  },
};

/** The 8 checklist items for the For Checking status. */
export const CHECKLIST_ITEMS: { key: ChecklistItemKey; label: string }[] = [
  { key: "needs-analysis", label: "Needs Analysis" },
  { key: "content-evaluation", label: "Results of Content Evaluation" },
  { key: "language-evaluation", label: "Results of Language Evaluation" },
  { key: "technical-evaluation", label: "Results of Technical Evaluation" },
  {
    key: "summary-findings",
    label: "Summary of Findings, Comments and Recommendations",
  },
  {
    key: "certificate-qa",
    label: "Certificate of Passing the Quality Assurance",
  },
  {
    key: "certificate-field-testing",
    label: "Certificate of Field Testing Results or Results",
  },
  { key: "copy-of-lrs", label: "Copy of LRs" },
];

/** Create a fresh checklist with all items unchecked. */
export function createEmptyChecklist(): ChecklistItem[] {
  return CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: false,
    date: null,
  }));
}

/** Count how many checklist items are checked. */
export function countChecked(items: ChecklistItem[]): number {
  return items.filter((item) => item.checked).length;
}

/** Check if all checklist items are checked. */
export function isChecklistComplete(items: ChecklistItem[]): boolean {
  return items.length > 0 && items.every((item) => item.checked);
}

/** Allowed next statuses from a given status, mirroring the DepEd QA workflow. */
export const STATUS_TRANSITIONS: Record<LRStatus, LRStatus[]> = {
  submitted: ["for-checking", "disapproved"],
  "for-checking": ["approved", "disapproved"],
  approved: ["published"],
  published: [],
  disapproved: ["for-checking"],
};

export const RESOURCE_TYPES: ResourceType[] = [
  "Self-Learning Module",
  "Activity Sheet",
  "Lesson Exemplar",
  "Video Lesson",
  "Storybook",
  "eBook",
  "Kasaysayan",
  "Strategic Intervention Materials (SIMs)",
  "Interactive Resources & Apps",
];

export const LEARNING_AREAS = [
  "English",
  "Filipino",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "Edukasyon sa Pagpapakatao",
  "GMRC",
  "Makabansa",
  "MAPEH",
  "TLE / EPP",
  "Mother Tongue",
  "Foreign Language",
  "Senior High School",
  "ALS",
  "Madrasah Education",
];

export const GRADE_LEVELS = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "ALS",
  "SNED",
  "Foreign Language",
  "MADRASAH",
];

export const QUARTERS = [
  "Quarter 1",
  "Quarter 2",
  "Quarter 3",
  "Quarter 4",
  "All Quarters",
];

/** Teaching positions / ranks used in SDO Batangas. */
export const POSITIONS = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Teacher IV",
  "Teacher V",
  "Teacher VI",
  "Teacher VII",
  "Master Teacher I",
  "Master Teacher II",
  "Master Teacher III",
  "Master Teacher IV",
  "Master Teacher V",
  "School Principal I",
  "School Principal II",
  "School Principal III",
  "School Principal IV",
];

/** Week options within a quarter: individual weeks plus duration ranges (e.g. Week 1-3). */
export const WEEKS: string[] = [
  "All Weeks",
  ...Array.from({ length: 8 }, (_, i) => `Week ${i + 1}`),
  ...Array.from({ length: 8 }, (_, s) => s + 1).flatMap((start) =>
    Array.from({ length: 8 - start }, (_, i) => `Week ${start}-${start + 1 + i}`),
  ),
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

let seedCounter = 0;
function seedResource(
  partial: Omit<
    LearningResource,
    "id" | "code" | "history" | "dateSubmitted" | "checklistItems" | "additionalAuthors"
  > & {
    submittedDaysAgo: number;
    checklistItems?: ChecklistItem[];
    trail: { status: LRStatus; daysAgo: number; remarks: string; checklistItems?: ChecklistItem[] | null }[];
  },
): LearningResource {
  seedCounter += 1;
  const { submittedDaysAgo, trail, checklistItems, ...rest } = partial;
  return {
    ...rest,
    additionalAuthors: [],
    checklistItems: checklistItems ?? createEmptyChecklist(),
    id: `seed-${seedCounter}`,
    code: `LR-2026-${String(seedCounter).padStart(4, "0")}`,
    dateSubmitted: daysAgo(submittedDaysAgo),
    history: trail.map((t) => ({
      status: t.status,
      date: daysAgo(t.daysAgo),
      remarks: t.remarks,
      checklistItems: t.checklistItems ?? null,
    })),
  };
}

/** Helper to create a fully-checked checklist for seed data. */
function fullChecklist(): ChecklistItem[] {
  return CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: true,
    date: daysAgo(20),
  }));
}

/** Helper to create a partially-checked checklist. */
function partialChecklist(checkedKeys: ChecklistItemKey[]): ChecklistItem[] {
  return CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: checkedKeys.includes(item.key),
    date: checkedKeys.includes(item.key) ? daysAgo(5) : null,
  }));
}

export const SEED_RESOURCES: LearningResource[] = [
  seedResource({
    title: "Paghinuha ng Damdamin ng Tauhan sa Kuwento",
    resourceType: "Self-Learning Module",
    learningArea: "Filipino",
    gradeLevel: "Grade 4",
    quarter: "Quarter 1",
    week: "Week 1",
    developer: "Maria Elena Santos",
    position: "Teacher III",
    division: "SDO Batangas",
    school: "Batangas City Elementary School",
    subOffice: "Balayan East",
    status: "published",
    submittedDaysAgo: 62,
    trail: [
      { status: "submitted", daysAgo: 62, remarks: "Received complete submission package." },
      { status: "for-checking", daysAgo: 58, remarks: "Checking submission documents for completeness.", checklistItems: partialChecklist([]) },
      { status: "for-checking", daysAgo: 30, remarks: "All checklist items verified and complete.", checklistItems: fullChecklist() },
      { status: "approved", daysAgo: 18, remarks: "Passed all quality assurance checks." },
      { status: "published", daysAgo: 9, remarks: "Uploaded to the DepEd LR Portal." },
    ],
  }),
  seedResource({
    title: "Solving Multi-Step Word Problems Involving Fractions",
    resourceType: "Activity Sheet",
    learningArea: "Mathematics",
    gradeLevel: "Grade 5",
    quarter: "Quarter 2",
    week: "Week 3",
    developer: "Jonathan R. Dela Cruz",
    position: "Teacher II",
    division: "SDO Batangas",
    school: "Lipa City National High School",
    subOffice: "Balayan East",
    status: "for-checking",
    checklistItems: partialChecklist(["needs-analysis", "content-evaluation"]),
    submittedDaysAgo: 12,
    trail: [
      { status: "submitted", daysAgo: 12, remarks: "Complete files received via division LRMDS." },
      { status: "for-checking", daysAgo: 10, remarks: "Admin checking submission completeness.", checklistItems: partialChecklist([]) },
      { status: "for-checking", daysAgo: 3, remarks: "Needs analysis and content evaluation completed.", checklistItems: partialChecklist(["needs-analysis", "content-evaluation"]) },
    ],
  }),
  seedResource({
    title: "Photosynthesis: Energy Transformation in Plants",
    resourceType: "Video Lesson",
    learningArea: "Science",
    gradeLevel: "Grade 8",
    quarter: "Quarter 1",
    week: "Week 5",
    developer: "Katrina Mae Villanueva",
    position: "Master Teacher I",
    division: "SDO Batangas",
    school: "Tanauan City National High School",
    subOffice: "Lemery",
    status: "for-checking",
    checklistItems: partialChecklist(["needs-analysis", "content-evaluation", "language-evaluation"]),
    submittedDaysAgo: 25,
    trail: [
      { status: "submitted", daysAgo: 25, remarks: "Video and lesson guide submitted." },
      { status: "for-checking", daysAgo: 23, remarks: "Checking documents and video format.", checklistItems: partialChecklist([]) },
    ],
  }),
  seedResource({
    title: "Ang mga Sinaunang Kabihasnan sa Asya",
    resourceType: "Lesson Exemplar",
    learningArea: "Araling Panlipunan",
    gradeLevel: "Grade 7",
    quarter: "Quarter 3",
    week: "Week 2",
    developer: "Roberto G. Aquino",
    position: "Teacher I",
    division: "SDO Batangas",
    school: "Bauan Technical High School",
    subOffice: "Balayan East",
    status: "approved",
    submittedDaysAgo: 40,
    trail: [
      { status: "submitted", daysAgo: 40, remarks: "Submission logged and acknowledged." },
      { status: "for-checking", daysAgo: 38, remarks: "Documents checked and complete.", checklistItems: fullChecklist() },
      { status: "approved", daysAgo: 5, remarks: "Approved with commendation; for portal upload." },
    ],
  }),
  seedResource({
    title: "Si Pagong at ang Mahiwagang Ilog (Big Book)",
    resourceType: "Storybook",
    learningArea: "Mother Tongue",
    gradeLevel: "Grade 2",
    quarter: "Quarter 1",
    week: "All Weeks",
    developer: "Liwayway P. Ramos",
    position: "Teacher III",
    division: "SDO Batangas",
    school: "Taal Central School",
    subOffice: "Calatagan",
    status: "submitted",
    submittedDaysAgo: 3,
    trail: [{ status: "submitted", daysAgo: 3, remarks: "Received; awaiting document checking." }],
  }),
  seedResource({
    title: "Reading Comprehension: Making Inferences",
    resourceType: "Self-Learning Module",
    learningArea: "English",
    gradeLevel: "Grade 6",
    quarter: "Quarter 2",
    week: "Week 4",
    developer: "Ana Patricia Lim",
    position: "Master Teacher II",
    division: "SDO Batangas",
    school: "Lemery Central School",
    subOffice: "Balayan East",
    status: "disapproved",
    submittedDaysAgo: 50,
    trail: [
      { status: "submitted", daysAgo: 50, remarks: "Module received for QA." },
      { status: "for-checking", daysAgo: 48, remarks: "Checking submission documents.", checklistItems: partialChecklist(["needs-analysis"]) },
      { status: "disapproved", daysAgo: 20, remarks: "Substantial overlap with an existing published module." },
    ],
  }),
  seedResource({
    title: "Pagpapahalaga sa Kapwa: Empatiya sa Komunidad",
    resourceType: "eBook",
    learningArea: "Edukasyon sa Pagpapakatao",
    gradeLevel: "Grade 9",
    quarter: "Quarter 4",
    week: "Week 6",
    developer: "Federico M. Bautista",
    position: "School Principal I",
    division: "SDO Batangas",
    school: "San Pascual National High School",
    subOffice: "Mabini",
    status: "for-checking",
    checklistItems: partialChecklist(["needs-analysis", "content-evaluation", "language-evaluation", "technical-evaluation"]),
    submittedDaysAgo: 15,
    trail: [
      { status: "submitted", daysAgo: 15, remarks: "eBook package complete." },
      { status: "for-checking", daysAgo: 13, remarks: "Documents checked and verified.", checklistItems: partialChecklist([]) },
    ],
  }),
  seedResource({
    title: "Basic Sketching and Perspective Drawing",
    resourceType: "Activity Sheet",
    learningArea: "MAPEH",
    gradeLevel: "Grade 10",
    quarter: "Quarter 3",
    week: "Week 7",
    developer: "Camille Joy Torres",
    position: "Teacher IV",
    division: "SDO Batangas",
    school: "Balayan National High School",
    subOffice: "Balayan East",
    status: "published",
    submittedDaysAgo: 75,
    trail: [
      { status: "submitted", daysAgo: 75, remarks: "Received by regional LRMDS." },
      { status: "for-checking", daysAgo: 73, remarks: "Submission documents checked.", checklistItems: fullChecklist() },
      { status: "approved", daysAgo: 33, remarks: "Passed all quality assurance checks." },
      { status: "published", daysAgo: 26, remarks: "Live on the LR Portal." },
    ],
  }),
];
