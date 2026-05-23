import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, KeyRound, MoreHorizontal, Plus, RefreshCw, Search, Users, PencilLine, Trash2 } from 'lucide-react';
import {
  adminDeleteUser,
  adminResetPassword,
  adminUpdateUser,
  fetchUsers,
  registerUser,
  type UpdatedUser,
} from '@/api/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserFormState = {
  first_name: string;
  last_name: string;
  username: string;
  role: 'admin' | 'staff';
};

const emptyForm: UserFormState = {
  first_name: '',
  last_name: '',
  username: '',
  role: 'staff',
};

const MASTER_USERNAME = 'master';

export default function UsersPage() {
  const currentUser = useStore((state) => state.user);
  const [items, setItems] = useState<UpdatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'admin' | 'staff'>('all');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<UpdatedUser | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordNotice, setResetPasswordNotice] = useState<string | null>(null);

  const getDeleteBlockReason = useCallback(
    (user: UpdatedUser) => {
      if (currentUser?.id === user.id) {
        return 'You cannot delete your own account.';
      }

      if (user.username === MASTER_USERNAME) {
        return 'The master account cannot be deleted.';
      }

      return null;
    },
    [currentUser?.id]
  );

  const loadUsers = useCallback(async () => {
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
  }, [role, search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!formOpen && !deleteTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (formOpen) {
          closeForm();
        }
        if (deleteTarget) {
          closeDeleteModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, formOpen]);

  const totalAdmins = useMemo(() => items.filter((u) => u.role === 'admin').length, [items]);

  const openCreateForm = () => {
    setEditingUserId(null);
    setForm(emptyForm);
    setNotice(null);
    setResetPasswordNotice(null);
    setFormOpen(true);
  };

  const openEditForm = (user: UpdatedUser) => {
    setEditingUserId(user.id);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role,
    });
    setNotice(null);
    setResetPasswordNotice(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingUserId(null);
    setForm(emptyForm);
    setResetPasswordNotice(null);
    setResettingPassword(false);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editingUserId) {
        await adminUpdateUser(editingUserId, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          role: form.role,
        });
        setNotice('User updated successfully.');
      } else {
        const created = await registerUser({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          username: form.username.trim(),
          role: form.role,
        });
        setNotice(`User created. Temporary password: ${created.password}`);
      }

      closeForm();
      await loadUsers();
    } catch {
      setError(editingUserId ? 'Failed to update user.' : 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUserId) return;

    setResettingPassword(true);
    setError(null);
    setNotice(null);
    setResetPasswordNotice(null);

    try {
      const result = await adminResetPassword(editingUserId);
      setResetPasswordNotice(`Temporary password for @${result.username}: ${result.temporaryPassword}`);
      setNotice(`Password reset for @${result.username}.`);
      await loadUsers();
    } catch {
      setError('Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  const openDeleteModal = (user: UpdatedUser) => {
    setNotice(null);
    setError(null);
    setDeleteTarget(user);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const handleDeleteUser = async (user: UpdatedUser) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await adminDeleteUser(user.id);
      setNotice('User deleted successfully.');
      await loadUsers();
    } catch {
      setError('Failed to delete user.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget || getDeleteBlockReason(deleteTarget)) {
      return;
    }

    await handleDeleteUser(deleteTarget);
    closeDeleteModal();
  };

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
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            {items.length} users · {totalAdmins} admins
          </div>
          <Button type="button" onClick={openCreateForm}>
            <Plus className="mr-2 size-4" />
            Add User
          </Button>
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
        {notice && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {formOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-modal-title"
              className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="user-modal-title" className="text-base font-semibold">
                    {editingUserId ? 'Edit user' : 'Add user'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingUserId ? 'Update profile details and role.' : 'Create a staff or admin account.'}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  Close
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((current) => ({ ...current, first_name: e.target.value }))}
                  placeholder="First name"
                />
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((current) => ({ ...current, last_name: e.target.value }))}
                  placeholder="Last name"
                />
                {!editingUserId && (
                  <Input
                    value={form.username}
                    onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                    placeholder="Username"
                  />
                )}
                <select
                  value={form.role}
                  onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as 'admin' | 'staff' }))}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editingUserId && resetPasswordNotice && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  {resetPasswordNotice}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void handleSaveUser()}
                  disabled={saving || !form.first_name.trim() || !form.last_name.trim() || (!editingUserId && !form.username.trim())}
                >
                  {saving ? 'Saving...' : editingUserId ? 'Update user' : 'Create user'}
                </Button>
                {editingUserId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleResetPassword()}
                    disabled={saving || resettingPassword}
                  >
                    {resettingPassword ? 'Resetting...' : (
                      <span className="inline-flex items-center gap-2">
                        <KeyRound className="size-4" /> Reset password
                      </span>
                    )}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDeleteModal();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-user-modal-title"
              className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="flex-1">
                  <h2 id="delete-user-modal-title" className="text-base font-semibold">
                    Delete user
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {deleteTarget.first_name} {deleteTarget.last_name} (@{deleteTarget.username})
                  </p>
                </div>
              </div>

              {getDeleteBlockReason(deleteTarget) ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  {getDeleteBlockReason(deleteTarget)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This will soft delete the account and remove access immediately.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={getDeleteBlockReason(deleteTarget) ? 'outline' : 'destructive'}
                  onClick={() => void confirmDeleteUser()}
                  disabled={saving || !!getDeleteBlockReason(deleteTarget)}
                >
                  {saving ? 'Deleting...' : 'Delete user'}
                </Button>
                <Button type="button" variant="outline" onClick={closeDeleteModal}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-border md:hidden">
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            {items.map((user) => (
              <div key={user.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0 rounded-lg">
                      <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                      <AvatarFallback className="rounded-lg text-xs">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Open actions for ${user.username}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          openEditForm(user);
                        }}
                      >
                        <PencilLine className="size-4" />
                        Edit user
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={(event) => {
                          event.preventDefault();
                          openDeleteModal(user);
                        }}
                      >
                        <Trash2 className="size-4" />
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="mt-1 font-semibold uppercase">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temp Password</p>
                    <p className="mt-1 font-semibold">{user.is_password_temp ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-lg border border-border md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Temp Password</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                        <AvatarFallback className="rounded-lg text-[10px]">
                          {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">@{user.username}</td>
                  <td className="px-3 py-2 uppercase">{user.role}</td>
                  <td className="px-3 py-2">{user.is_password_temp ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Open actions for ${user.username}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            openEditForm(user);
                          }}
                        >
                          <PencilLine className="size-4" />
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            openDeleteModal(user);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
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
