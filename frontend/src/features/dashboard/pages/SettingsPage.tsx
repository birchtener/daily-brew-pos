import { useRef, useState, useCallback } from "react";
import { User, Camera, Lock, LoaderCircle, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store/useStore";
import { uploadAvatar, updateProfile, updatePassword, deleteAvatar } from "@/api/users";
import { extractErrorMessage } from "@/lib/extractErrorMessage";
import type { ParsedUser } from "@/types/userTypes";
import type { UpdatedUser } from "@/api/users";
import { toast } from 'sonner';

/* ── helpers ───────────────────────────────────────────────── */

function syncStoreFromBackend(updated: UpdatedUser, setUser: (u: ParsedUser) => void) {
  setUser({
    id: updated.id,
    username: updated.username,
    role: updated.role,
    first_name: updated.first_name,
    last_name: updated.last_name,
    avatar_url: updated.avatar_url,
    is_password_temp: updated.is_password_temp,
  });
}

/* ── SettingsPage ──────────────────────────────────────────── */

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      {/* Avatar Section */}
      <AvatarSection user={user} setUser={setUser} />

      {/* Profile Section */}
      <ProfileSection user={user} setUser={setUser} />

      {/* Password Section */}
      <PasswordSection user={user} setUser={setUser} />
    </div>
  );
}

/* ── Avatar Section ────────────────────────────────────────── */

function AvatarSection({
  user,
  setUser,
}: {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be under 5 MB.");
        return;
      }

      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        toast.error("Only JPG, PNG, WebP, and GIF images are allowed.");
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    },
    [],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const updated = await uploadAvatar(selectedFile);
      syncStoreFromBackend(updated, setUser);
      setPreview(null);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Avatar upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    setUploading(true);

    try {
      const updated = await deleteAvatar();
      syncStoreFromBackend(updated, setUser);
      setPreview(null);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Avatar deleted successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Avatar deletion failed."));
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = preview ?? user?.avatar_url ?? undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <User className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">Profile Picture</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a new profile picture. Recommended size: 400×400 pixels.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Avatar with overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Change avatar"
        >
          <Avatar className="size-24 ring-2 ring-border ring-offset-2 ring-offset-background transition-shadow group-hover:ring-primary/50">
            <AvatarImage src={displaySrc} alt="Profile picture" />
            <AvatarFallback className="text-xl font-semibold bg-muted">
              {user?.first_name && user?.last_name &&
                `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
              }
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
        </button>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <p className="font-medium">{user?.first_name} {user?.last_name}</p>
            <p className="text-sm text-muted-foreground">@{user?.username} · <span className="uppercase">{user?.role}</span></p>
          </div>

          {selectedFile ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleUpload} disabled={uploading} size="sm">
                {uploading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <LoaderCircle className="size-3.5 animate-spin" /> Uploading…
                  </span>
                ) : (
                  "Upload"
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={uploading}>
                Cancel
              </Button>
              <span className="text-xs text-muted-foreground truncate max-w-50">
                {selectedFile.name}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => fileRef.current?.click()} variant="outline" size="sm">
                <Camera className="size-3.5 mr-1.5" />
                Change Photo
              </Button>
              {user?.avatar_url && (
                <Button onClick={handleDelete} variant="destructive" size="sm">
                  <Trash2 className="size-3.5 mr-1.5" />
                  Remove Photo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        id="avatar-upload-input"
      />

    </div>
  );
}

/* ── Profile Section ───────────────────────────────────────── */

function ProfileSection({
  user,
  setUser,
}: {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}) {
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [saving, setSaving] = useState(false);

  const isDirty = firstName !== (user?.first_name ?? "") || lastName !== (user?.last_name ?? "");

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
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Profile update failed."));
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
            "Save Changes"
          )}
        </Button>
        {isDirty && !saving && (
          <span className="text-xs text-muted-foreground">You have unsaved changes</span>
        )}
      </div>

    </div>
  );
}

/* ── Password Section ──────────────────────────────────────── */

function PasswordSection({
  user,
  setUser,
}: {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Password update failed."));
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
          ? "Set your first password. Minimum 6 characters."
          : "Update your account password. Minimum 6 characters."}
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
                type={showCurrent ? "text" : "password"}
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
                aria-label={showCurrent ? "Hide password" : "Show password"}
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
              type={showNew ? "text" : "password"}
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
              aria-label={showNew ? "Hide password" : "Show password"}
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
            "Update Password"
          )}
        </Button>
      </div>

    </div>
  );
}
