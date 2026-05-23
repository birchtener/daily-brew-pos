import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/api/notifications';

export default function NotificationsDropdown() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listNotifications({ page: 1, perPage: 10 });
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // no-op
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-90">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1 size-4" /> Mark all
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No notifications.</div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex cursor-pointer flex-col items-start gap-1 py-3"
              onSelect={(e) => {
                e.preventDefault();
                if (!item.is_read) {
                  void handleMarkRead(item.id);
                }
              }}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                {!item.is_read && <span className="mt-1 size-2 rounded-full bg-primary" />}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
