import { useCallback, useEffect, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

import { supabase } from "@/lib/supabase";

export interface VisitorEntry {
  id: string;
  name: string;
  email: string;
  visitedAt: string;
}

interface VisitorRow {
  id: string;
  name: string;
  email: string;
  visited_at: string;
}

function mapRow(row: VisitorRow): VisitorEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    visitedAt: row.visited_at,
  };
}

/** Fetch all visitors from Supabase, newest first. */
async function fetchVisitors(): Promise<VisitorEntry[]> {
  const PAGE = 1000;
  const rows: VisitorRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .order("visited_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("Failed to fetch visitors from Supabase", error);
      break;
    }
    rows.push(...((data ?? []) as VisitorRow[]));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return rows.map(mapRow);
}

/**
 * Visitor logging context backed by Supabase.
 * Admins can log visitor counts; viewer sign-ins are recorded automatically.
 */
function useVisitorsProvider() {
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchVisitors();
      if (!cancelled) {
        setVisitors(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime sync: when any other device logs or removes a visitor,
  // re-fetch so every signed-in admin sees the same list.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const data = await fetchVisitors();
        setVisitors(data);
      }, 300);
    };
    const channel = supabase
      .channel("visitors:sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitors" },
        refetch,
      )
      .subscribe();
    // Polling fallback in case realtime replication is unavailable.
    const poll = setInterval(async () => {
      const data = await fetchVisitors();
      setVisitors(data);
    }, 20_000);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, []);

  /** Record a visitor entry (used on viewer sign-in and manual admin log). */
  const logVisitor = useCallback((name: string, email: string): VisitorEntry => {
    const entry: VisitorEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      visitedAt: new Date().toISOString(),
    };
    setVisitors((prev) => [entry, ...prev]);

    // Sync to Supabase
    (async () => {
      await supabase.from("visitors").insert({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        visited_at: entry.visitedAt,
      });
    })();
    return entry;
  }, []);

  /** Manually log a visitor as an admin. */
  const addManualVisitor = useCallback((name: string, email: string) => {
    return logVisitor(name, email);
  }, [logVisitor]);

  /** Remove a visitor entry. */
  const removeVisitor = useCallback((id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));

    // Sync to Supabase
    (async () => {
      await supabase.from("visitors").delete().eq("id", id);
    })();
  }, []);

  /** Clear all visitor entries. */
  const clearVisitors = useCallback(() => {
    setVisitors([]);

    // Sync to Supabase
    (async () => {
      await supabase.from("visitors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    })();
  }, []);

  return { visitors, logVisitor, addManualVisitor, removeVisitor, clearVisitors, loading };
}

export const [VisitorProvider, useVisitors] = createContextHook(useVisitorsProvider);
