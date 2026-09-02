import { useCallback, useEffect, useRef, useState } from "react";

import { pushNotification } from "@/lib/notification";
import { supabase } from "@/lib/supabase";
import {
  CHECKLIST_ITEMS,
  SEED_RESOURCES,
  STATUS_CONFIG,
  createEmptyChecklist,
  type AdditionalAuthor,
  type ChecklistItem,
  type ChecklistItemKey,
  type LearningResource,
  type LRStatus,
  type ResourceType,
  type StatusEvent,
} from "@/lib/lr";

export interface NewResourceInput {
  title: string;
  resourceType: ResourceType;
  learningArea: string;
  gradeLevel: string;
  quarter: string;
  week: string;
  developer: string;
  position: string;
  additionalAuthors?: AdditionalAuthor[];
  submittedByEmail?: string;
  division: string;
  school: string;
  subOffice: string;
}

export interface EditResourceInput {
  title: string;
  code: string;
  resourceType: ResourceType;
  learningArea: string;
  gradeLevel: string;
  quarter: string;
  week: string;
  developer: string;
  position: string;
  additionalAuthors?: AdditionalAuthor[];
  school: string;
  subOffice: string;
}

/** Row shape from the Supabase learning_resources table. */
interface ResourceRow {
  id: string;
  code: string;
  title: string;
  resource_type: string;
  learning_area: string;
  grade_level: string;
  quarter: string;
  week: string | null;
  developer: string;
  position: string | null;
  additional_authors: AdditionalAuthor[] | null;
  submitted_by_email: string | null;
  division: string;
  school: string;
  sub_office: string;
  date_submitted: string;
  status: string;
  checking_items: ChecklistItem[] | null;
}

interface HistoryRow {
  id: string;
  resource_id: string;
  status: string;
  date: string;
  remarks: string;
  checking_items: ChecklistItem[] | null;
}

function mapRowToResource(row: ResourceRow, history: HistoryRow[]): LearningResource {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    resourceType: row.resource_type as ResourceType,
    learningArea: row.learning_area,
    gradeLevel: row.grade_level,
    quarter: row.quarter,
    week: row.week ?? "",
    developer: row.developer,
    position: row.position ?? "",
    additionalAuthors: Array.isArray(row.additional_authors) ? row.additional_authors : [],
    submittedByEmail: row.submitted_by_email ?? undefined,
    division: row.division,
    school: row.school,
    subOffice: row.sub_office,
    dateSubmitted: row.date_submitted,
    status: row.status as LRStatus,
    checklistItems: normalizeChecklist(row.checking_items),
    history: history.map((h): StatusEvent => ({
      status: h.status as LRStatus,
      date: h.date,
      remarks: h.remarks,
      checklistItems: h.checking_items ?? null,
    })),
  };
}

/** Ensure checklist items have all keys and correct labels. */
function normalizeChecklist(items: ChecklistItem[] | null): ChecklistItem[] {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return createEmptyChecklist();
  }
  return CHECKLIST_ITEMS.map((template) => {
    const found = items.find((i) => i.key === template.key);
    return {
      key: template.key,
      label: template.label,
      checked: found?.checked ?? false,
      date: found?.date ?? null,
    };
  });
}

/** Seed the database with initial resources if the table is empty. */
async function seedIfEmpty(): Promise<void> {
  const { count } = await supabase
    .from("learning_resources")
    .select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  for (const resource of SEED_RESOURCES) {
    const { data: row } = await supabase
      .from("learning_resources")
      .insert({
        id: resource.id.startsWith("seed-") ? undefined : resource.id,
        code: resource.code,
        title: resource.title,
        resource_type: resource.resourceType,
        learning_area: resource.learningArea,
        grade_level: resource.gradeLevel,
        quarter: resource.quarter,
        week: resource.week,
        developer: resource.developer,
        position: resource.position,
        additional_authors: [],
        division: resource.division,
        school: resource.school,
        sub_office: resource.subOffice,
        date_submitted: resource.dateSubmitted,
        status: resource.status,
        checking_items: resource.checklistItems,
      })
      .select()
      .single();
    if (row) {
      await supabase.from("resource_history").insert(
        resource.history.map((h) => ({
          resource_id: row.id,
          status: h.status,
          date: h.date,
          remarks: h.remarks,
          checking_items: h.checklistItems ?? null,
        })),
      );
    }
  }
}

/** Fetch all resources with their history from Supabase. */
async function fetchResources(): Promise<LearningResource[]> {
  const { data: rows, error } = await supabase
    .from("learning_resources")
    .select("*")
    .order("date_submitted", { ascending: false });
  if (error) {
    console.error("Failed to fetch resources from Supabase", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const { data: histRows, error: histError } = await supabase
    .from("resource_history")
    .select("*")
    .order("date", { ascending: true });
  if (histError) {
    console.error("Failed to fetch resource history from Supabase", histError);
  }

  const historyByResource = new Map<string, HistoryRow[]>();
  for (const h of (histRows ?? []) as HistoryRow[]) {
    const list = historyByResource.get(h.resource_id) ?? [];
    list.push(h);
    historyByResource.set(h.resource_id, list);
  }

  return (rows as ResourceRow[]).map((row) =>
    mapRowToResource(row, historyByResource.get(row.id) ?? []),
  );
}

/**
 * Supabase-backed store for tracked learning resources.
 * Data is fetched from the database on mount and synced on every mutation.
 */
export function useResources() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mirror of resources for lookups inside event callbacks.
  const resourcesRef = useRef<LearningResource[]>([]);
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await seedIfEmpty();
      const data = await fetchResources();
      if (!cancelled) {
        setResources(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addResource = useCallback((input: NewResourceInput): LearningResource => {
    const now = new Date().toISOString();
    const serial = Date.now().toString().slice(-4);
    const created: LearningResource = {
      ...input,
      additionalAuthors: input.additionalAuthors ?? [],
      id: crypto.randomUUID(),
      code: `LR-${new Date().getFullYear()}-${serial}`,
      dateSubmitted: now,
      status: "submitted",
      checklistItems: createEmptyChecklist(),
      history: [
        {
          status: "submitted",
          date: now,
          remarks: "Submission received and logged in the tracker.",
        },
      ],
    };
    setResources((prev) => [created, ...prev]);

    // Sync to Supabase
    (async () => {
      const { data: row } = await supabase
        .from("learning_resources")
        .insert({
          id: created.id,
          code: created.code,
          title: created.title,
          resource_type: created.resourceType,
          learning_area: created.learningArea,
          grade_level: created.gradeLevel,
          quarter: created.quarter,
          week: created.week,
          developer: created.developer,
          position: created.position,
          additional_authors: created.additionalAuthors,
          submitted_by_email: created.submittedByEmail ?? null,
          division: created.division,
          school: created.school,
          sub_office: created.subOffice,
          date_submitted: created.dateSubmitted,
          status: created.status,
          checking_items: created.checklistItems,
        })
        .select()
        .single();
      if (row) {
        await supabase.from("resource_history").insert({
          resource_id: created.id,
          status: "submitted",
          date: now,
          remarks: "Submission received and logged in the tracker.",
        });
      }

      // Notify the admin that a viewer submitted a new LR.
      if (created.submittedByEmail) {
        await pushNotification({
          audience: "admin",
          type: "new-submission",
          title: created.title,
          message: `New learning resource submitted by ${created.developer} (${created.school}).`,
          resourceId: created.id,
          resourceCode: created.code,
          resourceStatus: created.status,
        });
      }
    })();
    return created;
  }, []);

  const updateStatus = useCallback(
    (id: string, status: LRStatus, remarks: string) => {
      const now = new Date().toISOString();
      setResources((prev) =>
        prev.map((resource) => {
          if (resource.id !== id) return resource;
          const event: StatusEvent = {
            status,
            date: now,
            remarks: remarks.trim() || "Status updated.",
            checklistItems:
              status === "for-checking" ? resource.checklistItems : null,
          };
          return {
            ...resource,
            status,
            history: [...resource.history, event],
          };
        }),
      );

      // Sync to Supabase
      (async () => {
        await supabase
          .from("learning_resources")
          .update({
            status,
            updated_at: now,
          })
          .eq("id", id);
        await supabase.from("resource_history").insert({
          resource_id: id,
          status,
          date: now,
          remarks: remarks.trim() || "Status updated.",
        });

        // Notify the submitting viewer that their LR status changed.
        const target = resourcesRef.current.find((r) => r.id === id);
        if (target?.submittedByEmail) {
          await pushNotification({
            audience: "viewer",
            targetEmail: target.submittedByEmail,
            type: "status-change",
            title: target.title,
            message: `Status of your submitted LR "${target.title}" (${target.code}) is now ${STATUS_CONFIG[status].label}.${remarks.trim() ? ` Remarks: ${remarks.trim()}` : ""}`,
            resourceId: id,
            resourceCode: target.code,
            resourceStatus: status,
          });
        }
      })();
    },
    [],
  );

  const toggleChecklistItem = useCallback(
    (id: string, itemKey: ChecklistItemKey) => {
      const now = new Date().toISOString();
      setResources((prev) =>
        prev.map((resource) => {
          if (resource.id !== id) return resource;
          const updatedItems = resource.checklistItems.map((item) =>
            item.key === itemKey
              ? { ...item, checked: !item.checked, date: !item.checked ? now : null }
              : item,
          );
          const event: StatusEvent = {
            status: "for-checking",
            date: now,
            remarks: `Checklist item "${CHECKLIST_ITEMS.find((i) => i.key === itemKey)?.label}" ${updatedItems.find((i) => i.key === itemKey)?.checked ? "completed" : "unchecked"}.`,
            checklistItems: updatedItems,
          };
          return {
            ...resource,
            checklistItems: updatedItems,
            history: [...resource.history, event],
          };
        }),
      );

      // Sync to Supabase
      (async () => {
        const resource = (await supabase
          .from("learning_resources")
          .select("checking_items")
          .eq("id", id)
          .single()) as { data: { checking_items: ChecklistItem[] | null } | null };

        if (resource.data) {
          const current = normalizeChecklist(resource.data.checking_items);
          const updatedItems = current.map((item) =>
            item.key === itemKey
              ? { ...item, checked: !item.checked, date: !item.checked ? now : null }
              : item,
          );
          const label = CHECKLIST_ITEMS.find((i) => i.key === itemKey)?.label;
          const isChecked = updatedItems.find((i) => i.key === itemKey)?.checked;

          await supabase
            .from("learning_resources")
            .update({
              checking_items: updatedItems,
              updated_at: now,
            })
            .eq("id", id);
          await supabase.from("resource_history").insert({
            resource_id: id,
            status: "for-checking",
            date: now,
            remarks: `Checklist item "${label}" ${isChecked ? "completed" : "unchecked"}.`,
            checking_items: updatedItems,
          });
        }
      })();
    },
    [],
  );

  const editResource = useCallback((id: string, input: EditResourceInput) => {
    const now = new Date().toISOString();
    setResources((prev) =>
      prev.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              title: input.title,
              code: input.code,
              resourceType: input.resourceType,
              learningArea: input.learningArea,
              gradeLevel: input.gradeLevel,
              quarter: input.quarter,
              week: input.week,
              developer: input.developer,
              position: input.position,
              school: input.school,
              subOffice: input.subOffice,
            }
          : resource,
      ),
    );

    // Sync to Supabase
    (async () => {
      await supabase
        .from("learning_resources")
        .update({
          title: input.title,
          code: input.code,
          resource_type: input.resourceType,
          learning_area: input.learningArea,
          grade_level: input.gradeLevel,
          quarter: input.quarter,
          week: input.week,
          developer: input.developer,
          position: input.position,
          additional_authors: input.additionalAuthors ?? [],
          school: input.school,
          sub_office: input.subOffice,
          updated_at: now,
        })
        .eq("id", id);
    })();
  }, []);

  const removeResource = useCallback((id: string) => {
    setResources((prev) => prev.filter((resource) => resource.id !== id));

    // Sync to Supabase (history cascades on delete)
    (async () => {
      await supabase.from("learning_resources").delete().eq("id", id);
    })();
  }, []);

  return {
    resources,
    addResource,
    updateStatus,
    toggleChecklistItem,
    editResource,
    removeResource,
    loading,
  };
}
