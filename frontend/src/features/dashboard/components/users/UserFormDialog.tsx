import { KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type UserFormState = {
  first_name: string;
  last_name: string;
  username: string;
  role: 'admin' | 'staff';
};

interface UserFormDialogProps {
  editingUserId: string | null;
  form: UserFormState;
  onFormChange: (form: UserFormState) => void;
  saving: boolean;
  resettingPassword: boolean;
  resetPasswordNotice: string | null;
  onSave: () => void;
  onResetPassword: () => void;
  onClose: () => void;
}

export default function UserFormDialog({
  editingUserId,
  form,
  onFormChange,
  saving,
  resettingPassword,
  resetPasswordNotice,
  onSave,
  onResetPassword,
  onClose,
}: UserFormDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
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
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.first_name}
            onChange={(e) => onFormChange({ ...form, first_name: e.target.value })}
            placeholder="First name"
          />
          <Input
            value={form.last_name}
            onChange={(e) => onFormChange({ ...form, last_name: e.target.value })}
            placeholder="Last name"
          />
          {!editingUserId && (
            <Input
              value={form.username}
              onChange={(e) => onFormChange({ ...form, username: e.target.value })}
              placeholder="Username"
            />
          )}
          <Select
            value={form.role}
            onValueChange={(val) => onFormChange({ ...form, role: val as 'admin' | 'staff' })}
          >
            <SelectTrigger className="h-9 w-full bg-background border border-border text-sm font-medium text-foreground">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {editingUserId && resetPasswordNotice && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 select-text">
            {resetPasswordNotice}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !form.first_name.trim() || !form.last_name.trim() || (!editingUserId && !form.username.trim())}
          >
            {saving ? 'Saving...' : editingUserId ? 'Update user' : 'Create user'}
          </Button>
          {editingUserId && (
            <Button
              type="button"
              variant="outline"
              onClick={onResetPassword}
              disabled={saving || resettingPassword}
            >
              {resettingPassword ? 'Resetting...' : (
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="size-4" /> Reset password
                </span>
              )}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
