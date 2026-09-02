import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  mapNotificationRow,
  type AppNotification,
  type NotificationRow,
} from "@/lib/notification";
import { supabase } from "@/lib/supabase";

/** Fetch notifications relevant to the current user, newest first. */
async function fetchNotifications(
  isAdmin: boolean,
  email: string,
): Promise<AppNotification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  query = isAdmin
    ? query.eq("audience", "admin")
    : query.eq("audience", "viewer").eq("target_email", email);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch notifications from Supabase", error);
    return [];
  }
  return (data as NotificationRow[]).map(mapNotificationRow);
}

/**
 * Real-time in-app notification center.
 * - Admins receive a notification whenever a viewer submits a new LR.
 * - Viewers receive a notification whenever the status of their own LR changes.
 */
function useNotificationsProvider() {
  const { user, isAdmin } = useAuth();
  const email = user?.email?.trim().toLowerCase() ?? "";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const audienceKey = isAdmin ? "admin" : `viewer:${email}`;

  // Initial fetch + realtime subscription, keyed to the signed-in user.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await fetchNotifications(isAdmin, email);
      if (!cancelled) {
        setNotifications(data);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`notifications:${audienceKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          // Only surface notifications addressed to this user.
          const relevant = isAdmin
            ? row.audience === "admin"
            : row.audience === "viewer" &&
              (row.target_email ?? "").trim().toLowerCase() === email;
          if (!relevant) return;

          const notification = mapNotificationRow(row);
          if (cancelled) return;
          setNotifications((prev) => [notification, ...prev]);
          toast(notification.title, { description: notification.message });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, email, audienceKey]);

  /** Mark a single notification as read. */
  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    void supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  /** Mark every visible notification as read. */
  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const unreadIds = prev.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        void supabase
          .from("notifications")
          .update({ read: true })
          .in("id", unreadIds);
      }
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  /** Clear every visible notification for this user. */
  const clearNotifications = useCallback(() => {
    setNotifications((prev) => {
      const ids = prev.map((n) => n.id);
      if (ids.length > 0) {
        void supabase.from("notifications").delete().in("id", ids);
      }
      return [];
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    clearNotifications,
  };
}

export const [NotificationsProvider, useNotifications] = createContextHook(
  useNotificationsProvider,
);
