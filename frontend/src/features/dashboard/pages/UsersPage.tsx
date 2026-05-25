import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminDeleteUser,
  adminResetPassword,
  adminUpdateUser,
  fetchUsers,
  registerUser,
  type UpdatedUser,
} from '@/api/users';
import { useStore } from '@/store/useStore';
import UsersHeader from '../components/users/UsersHeader';
import UsersToolbar from '../components/users/UsersToolbar';
import UsersList from '../components/users/UsersList';
import UserFormDialog, { type UserFormState } from '../components/users/UserFormDialog';
import DeleteUserDialog from '../components/users/DeleteUserDialog';

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
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <UsersHeader
        itemsCount={items.length}
        adminsCount={totalAdmins}
        onAddClick={openCreateForm}
      />

      <UsersToolbar
        search={search}
        onSearchChange={setSearch}
        role={role}
        onRoleChange={setRole}
        loading={loading}
        onRefresh={() => void loadUsers()}
        error={error}
        notice={notice}
      />

      <UsersList
        users={items}
        loading={loading}
        error={error}
        onEdit={openEditForm}
        onDelete={openDeleteModal}
        onRetry={() => void loadUsers()}
      />

      {formOpen && (
        <UserFormDialog
          editingUserId={editingUserId}
          form={form}
          onFormChange={setForm}
          saving={saving}
          resettingPassword={resettingPassword}
          resetPasswordNotice={resetPasswordNotice}
          onSave={() => void handleSaveUser()}
          onResetPassword={() => void handleResetPassword()}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <DeleteUserDialog
          deleteTarget={deleteTarget}
          deleteBlockReason={getDeleteBlockReason(deleteTarget)}
          saving={saving}
          onConfirm={() => void confirmDeleteUser()}
          onClose={closeDeleteModal}
        />
      )}
    </div>
  );
}
