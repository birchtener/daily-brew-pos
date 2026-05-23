import { useEffect, useState } from 'react';
import { Bell, RefreshCw, Send } from 'lucide-react';
import {
  createNotification,
  deleteNotification,
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from '@/api/notifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NotificationsAdminPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listNotifications({ page: 1, perPage: 50 });
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      await createNotification({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // no-op
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // no-op
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 pb-12 sm:px-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Bell className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <p className="text-sm text-muted-foreground">Create and monitor system notifications for staff.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Create Notification</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={200} />
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
          <Button type="button" onClick={() => void submit()} disabled={submitting || !title.trim() || !body.trim()}>
            <Send className="mr-2 size-4" /> Send
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Recent</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void markRead(item.id)}
                  disabled={item.is_read}
                >
                  {item.is_read ? 'Read' : 'Mark Read'}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => void remove(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {!loading && items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
