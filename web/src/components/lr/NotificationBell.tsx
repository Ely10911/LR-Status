import { UploadCloud, RefreshCcw, Trash2, Bell, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import {
  formatRelativeTime,
  type AppNotification,
} from "@/lib/notification";
import { STATUS_CONFIG, type LRStatus } from "@/lib/lr";
import { cn } from "@/lib/utils";

/** Icon for a notification, tinted by event type. */
function NotificationIcon({ notification }: { notification: AppNotification }) {
  if (notification.type === "new-submission") {
    return <UploadCloud className="h-4 w-4 text-sky-600" />;
  }
  const disapproved = notification.resourceStatus === "disapproved";
  return (
    <RefreshCcw
      className={cn("h-4 w-4", disapproved ? "text-red-600" : "text-emerald-600")}
    />
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const statusLabel = notification.resourceStatus
    ? STATUS_CONFIG[notification.resourceStatus as LRStatus]?.label
    : undefined;

  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className="flex w-full items-start gap-3 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <NotificationIcon notification={notification} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{notification.title}</span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          {statusLabel && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
              {statusLabel}
            </span>
          )}
          {notification.resourceCode && <span>{notification.resourceCode}</span>}
          <span>{formatRelativeTime(notification.createdAt)}</span>
        </span>
      </span>
    </button>
  );
}

/**
 * Header bell with unread badge and a popover listing the signed-in
 * user's notifications (admin: new submissions; viewer: status changes).
 */
export function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, clearNotifications } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          className="relative border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg ring-2 ring-primary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearNotifications}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading notifications…
            </p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                You'll see updates here as they happen.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markRead}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
