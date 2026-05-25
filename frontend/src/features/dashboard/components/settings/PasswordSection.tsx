import { useState } from 'react';
import { Lock, LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updatePassword } from '@/api/users';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import type { ParsedUser } from '@/types/userTypes';
import { toast } from 'sonner';

interface PasswordSectionProps {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}

export default function PasswordSection({ user, setUser }: PasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTemporaryPassword = !!user?.is_password_temp;

  const currentError = currentPassword.length > 0 && currentPassword.length < 6;
  const newError = newPassword.length > 0 && newPassword.length < 6;
  const canSave =
    newPassword.length >= 6 &&
    (isTemporaryPassword || currentPassword.length >= 6) &&
    (isTemporaryPassword || currentPassword !== newPassword);

  const handleChangePassword = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      await updatePassword({
        ...(isTemporaryPassword ? {} : { currentPassword }),
        newPassword,
      });
      if (user) {
        setUser({ ...user, is_password_temp: false });
      }
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Password update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">Change Password</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {isTemporaryPassword
          ? 'Set your first password. Minimum 6 characters.'
          : 'Update your account password. Minimum 6 characters.'}
      </p>

      <div className="grid gap-4 max-w-lg">
        {!isTemporaryPassword && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-current-password" className="text-sm font-medium">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="settings-current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                }}
                placeholder="••••••••"
                className="pr-11"
                aria-invalid={currentError}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {currentError && (
              <p className="text-xs text-destructive">Must be at least 6 characters.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-new-password" className="text-sm font-medium">
            New Password
          </label>
          <div className="relative">
            <Input
              id="settings-new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
              }}
              placeholder="••••••••"
              className="pr-11"
              aria-invalid={newError}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {newError && (
            <p className="text-xs text-destructive">Must be at least 6 characters.</p>
          )}
          {!isTemporaryPassword &&
            currentPassword.length >= 6 &&
            newPassword.length >= 6 &&
            currentPassword === newPassword && (
              <p className="text-xs text-destructive">
                New password must be different from current password.
              </p>
            )}
        </div>
      </div>

      <div className="mt-5">
        <Button onClick={handleChangePassword} disabled={!canSave || saving} size="sm">
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle className="size-3.5 animate-spin" /> Updating…
            </span>
          ) : (
            'Update Password'
          )}
        </Button>
      </div>
    </div>
  );
}
