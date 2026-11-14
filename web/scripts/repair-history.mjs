/**
 * One-time repair of resource_history records that made statuses appear to
 * "go back" in the timeline:
 *
 * 1. Resources whose saved status has no matching history entry get one
 *    appended (the original insert failed silently).
 * 2. Spurious "Submission received and logged in the tracker." entries that
 *    are NOT a resource's first entry are removed (they made published LRs
 *    look like they went back to Submitted).
 *
 * Usage: cd web && bun scripts/repair-history.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const PAGE = 1000;
async function fetchAllRows(table, orderColumn, ascending) {
  const all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

const resources = await fetchAllRows("learning_resources", "date_submitted", false);
const history = await fetchAllRows("resource_history", "date", true);

const byResource = new Map();
for (const h of history) {
  const list = byResource.get(h.resource_id) ?? [];
  list.push(h);
  byResource.set(h.resource_id, list);
}

const SUBMITTED_REMARK = "Submission received and logged in the tracker.";
let removedSpurious = 0;
let addedMissing = 0;

for (const row of resources) {
  const entries = byResource.get(row.id) ?? [];

  // 1. Remove spurious "Submission received" entries that are not the first entry.
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].remarks === SUBMITTED_REMARK) {
      const { error } = await supabase
        .from("resource_history")
        .delete()
        .eq("id", entries[i].id);
      if (error) console.error(`Failed to delete spurious entry ${entries[i].id}`, error);
      else removedSpurious++;
    }
  }

  // 2. Append the missing history entry for the saved status.
  const liveEntries = entries.filter(
    (e, i) => i === 0 || e.remarks !== SUBMITTED_REMARK,
  );
  const latest = liveEntries[liveEntries.length - 1];
  if (!latest || latest.status !== row.status) {
    const date = row.updated_at ?? new Date().toISOString();
    const { error } = await supabase.from("resource_history").insert({
      resource_id: row.id,
      status: row.status,
      date,
      remarks: "Status updated.",
    });
    if (error) console.error(`Failed to add missing entry for ${row.code}`, error);
    else {
      addedMissing++;
      console.log(
        `added missing "${row.status}" entry for ${row.code} (last was "${latest?.status ?? "none"}")`,
      );
    }
  }
}

console.log(`\nDone. Removed ${removedSpurious} spurious entries, added ${addedMissing} missing entries.`);
