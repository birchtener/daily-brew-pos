import { useEffect, useMemo, useState } from 'react';

import { Bell, ExternalLink, Loader2, MessageSquareText, RefreshCw, Send, X } from 'lucide-react';

import { createNotification, deleteNotification, listNotifications, markNotificationRead, type NotificationItem } from '@/api/notifications';
import { fetchUsers, type UpdatedUser } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function getCreatorLabel(notification: NotificationItem, users: UpdatedUser[]) {
  if (!notification.created_by || notification.created_by === (import.meta.env.VITE_SYSTEM_USER || "00000000-0000-0000-0000-000000000000")) {
    return 'System';
  }

  const match = users.find((user) => user.id === notification.created_by);
  if (match) {
    return `${match.first_name} ${match.last_name} (@${match.username})`;
  }

  return notification.created_by;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<UpdatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, usersData] = await Promise.all([
        listNotifications({ page: 1, perPage: 50 }),
        fetchUsers({ page: 1, perPage: 100 }),
      ]);
      setItems(data.items);
      setUsers(usersData.items);
    } catch {
      setItems([]);
      setUsers([]);
      toast.error('We could not load notifications right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      await createNotification({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      toast.success('Notification published successfully.');
      await load();
    } catch {
      toast.error('We could not publish the notification. Please check the text and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      } catch {
        // keep the modal open even if marking read fails
      }
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedNotification((current) => (current?.id === id ? null : current));
      toast.success('Notification removed.');
    } catch {
      toast.error('We could not remove this notification. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Bell className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <p className="text-sm text-muted-foreground">Create announcements, review who posted them, and open each item for details.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Create Notification</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" maxLength={200} />
          <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" />
          <Button type="button" onClick={() => void submit()} disabled={submitting || !title.trim() || !body.trim()}>
            <Send className="mr-2 size-4" /> Send
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">Recent</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{unreadCount} unread</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openNotification(item)}
                className="flex w-full items-start justify-between gap-4 rounded-lg border border-border p-3 text-left transition hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {!item.is_read && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Announced by {getCreatorLabel(item, users)}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{new Date(item.created_at).toLocaleString()}</p>
                  <p className="mt-1">{item.user_id ? 'Targeted' : 'Broadcast'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotification(null);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <MessageSquareText className="size-5 text-primary" /> Notification Details
                </h2>
                <p className="text-sm text-muted-foreground">Review the announcement and its source.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Title</p>
                <p className="mt-1 font-medium text-foreground">{selectedNotification.title}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-card-foreground">{selectedNotification.body}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Announced by</p>
                  <p className="mt-1 text-card-foreground">{getCreatorLabel(selectedNotification, users)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Audience</p>
                  <p className="mt-1 text-card-foreground">{selectedNotification.user_id ? `User: ${selectedNotification.user_id}` : 'Broadcast to everyone'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                  <p className="mt-1 text-card-foreground">{selectedNotification.is_read ? 'Read' : 'Unread'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                  <p className="mt-1 text-card-foreground">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedNotification.link && (
                <a
                  href={selectedNotification.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-4" /> Open linked page
                </a>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void remove(selectedNotification.id)}
                >
                  Delete
                </Button>
                <Button type="button" onClick={() => setSelectedNotification(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}