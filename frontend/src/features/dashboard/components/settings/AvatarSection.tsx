import { useRef, useState, useCallback } from 'react';
import { User, Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadAvatar, deleteAvatar } from '@/api/users';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import type { ParsedUser } from '@/types/userTypes';
import { toast } from 'sonner';
import { syncStoreFromBackend } from './helpers';

interface AvatarSectionProps {
  user: ParsedUser | null;
  setUser: (u: ParsedUser) => void;
}

export default function AvatarSection({ user, setUser }: AvatarSectionProps) {
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
        toast.error('File size must be under 5 MB.');
        return;
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        toast.error('Only JPG, PNG, WebP, and GIF images are allowed.');
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    },
    []
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const updated = await uploadAvatar(selectedFile);
      syncStoreFromBackend(updated, setUser);
      setPreview(null);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Avatar upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async () => {
    setUploading(true);

    try {
      const updated = await deleteAvatar();
      syncStoreFromBackend(updated, setUser);
      setPreview(null);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Avatar deleted successfully!');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Avatar deletion failed.'));
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
                  'Upload'
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
