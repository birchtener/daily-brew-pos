import { useState } from 'react';
import { User, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProfile } from '@/api/users';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import type { ParsedUser } from '@/types/userTypes';
import { toast } from 'sonner';
import { syncStoreFromBackend } from './helpers';

interface ProfileSectionProps {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}

export default function ProfileSection({ user, setUser }: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [saving, setSaving] = useState(false);

  const isDirty = firstName !== (user?.first_name ?? '') || lastName !== (user?.last_name ?? '');

  const firstNameError = firstName.length > 0 && (firstName.length < 3 || firstName.length > 20);
  const lastNameError = lastName.length > 0 && (lastName.length < 3 || lastName.length > 20);
  const canSave = isDirty && !firstNameError && !lastNameError && firstName.length >= 3 && lastName.length >= 3;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
      });
      syncStoreFromBackend(updated, setUser);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Profile update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <User className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">Profile Information</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Update your display name.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-first-name" className="text-sm font-medium">
            First Name
          </label>
          <Input
            id="settings-first-name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
            placeholder="First name"
            aria-invalid={firstNameError}
          />
          {firstNameError && (
            <p className="text-xs text-destructive">Must be 3–20 characters.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-last-name" className="text-sm font-medium">
            Last Name
          </label>
          <Input
            id="settings-last-name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
            placeholder="Last name"
            aria-invalid={lastNameError}
          />
          {lastNameError && (
            <p className="text-xs text-destructive">Must be 3–20 characters.</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleSave} disabled={!canSave || saving} size="sm">
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle className="size-3.5 animate-spin" /> Saving…
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
        {isDirty && !saving && (
          <span className="text-xs text-muted-foreground">You have unsaved changes</span>
        )}
      </div>
    </div>
  );
}
