import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, Search } from 'lucide-react';
import { fetchUsers, type UpdatedUser } from '@/api/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const [items, setItems] = useState<UpdatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'admin' | 'staff'>('all');
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers({
        page: 1,
        perPage: 50,
        q: search.trim() || undefined,
        role: role === 'all' ? undefined : role,
      });
      setItems(data.items);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const totalAdmins = useMemo(() => items.filter((u) => u.role === 'admin').length, [items]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 pb-12 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage staff and admin accounts.</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {items.length} users · {totalAdmins} admins
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or name"
              className="pl-9"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'all' | 'admin' | 'staff')}
            className="flex h-9 min-w-38 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <Button type="button" variant="outline" onClick={() => void loadUsers()} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Temp Password</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-2">{user.first_name} {user.last_name}</td>
                  <td className="px-3 py-2">@{user.username}</td>
                  <td className="px-3 py-2 uppercase">{user.role}</td>
                  <td className="px-3 py-2">{user.is_password_temp ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
