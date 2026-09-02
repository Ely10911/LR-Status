import { supabase } from "@/lib/supabase";

/** Who the notification is for: the LRMS admin, or the submitting viewer. */
export type NotificationAudience = "admin" | "viewer";

/** Kind of event that produced the notification. */
export type NotificationType = "new-submission" | "status-change";

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  targetEmail: string | null;
  type: NotificationType;
  title: string;
  message: string;
  resourceId: string | null;
  resourceCode: string | null;
  resourceStatus: string | null;
  read: boolean;
  createdAt: string;
}

/** Row shape from the Supabase notifications table. */
export interface NotificationRow {
  id: string;
  audience: string;
  target_email: string | null;
  type: string;
  title: string;
  message: string;
  resource_id: string | null;
  resource_code: string | null;
  resource_status: string | null;
  read: boolean;
  created_at: string;
}

export function mapNotificationRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    audience: row.audience as NotificationAudience,
    targetEmail: row.target_email,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    resourceId: row.resource_id,
    resourceCode: row.resource_code,
    resourceStatus: row.resource_status,
    read: row.read,
    createdAt: row.created_at,
  };
}

export interface PushNotificationInput {
  audience: NotificationAudience;
  targetEmail?: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceId?: string;
  resourceCode?: string;
  resourceStatus?: string;
}

/**
 * Persist a notification to Supabase so every signed-in device receives it
 * in real time. Fire-and-forget: failures are logged, never thrown.
 */
export async function pushNotification(input: PushNotificationInput): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    audience: input.audience,
    target_email: input.targetEmail ?? null,
    type: input.type,
    title: input.title,
    message: input.message,
    resource_id: input.resourceId ?? null,
    resource_code: input.resourceCode ?? null,
    resource_status: input.resourceStatus ?? null,
  });
  if (error) {
    console.error("Failed to push notification", error);
  }
}

/** Human-friendly relative time, e.g. "just now", "5m ago", "3d ago". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
