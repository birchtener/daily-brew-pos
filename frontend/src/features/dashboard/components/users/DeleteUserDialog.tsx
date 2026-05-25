import { AlertTriangle } from 'lucide-react';
import type { UpdatedUser } from '@/api/users';
import { Button } from '@/components/ui/button';

interface DeleteUserDialogProps {
  deleteTarget: UpdatedUser;
  deleteBlockReason: string | null;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteUserDialog({
  deleteTarget,
  deleteBlockReason,
  saving,
  onConfirm,
  onClose,
}: DeleteUserDialogProps) {
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
            <p className="text-sm text-muted-foreground select-text">
              {deleteTarget.first_name} {deleteTarget.last_name} (@{deleteTarget.username})
            </p>
          </div>
        </div>

        {deleteBlockReason ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {deleteBlockReason}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This will soft delete the account and remove access immediately.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={deleteBlockReason ? 'outline' : 'destructive'}
            onClick={onConfirm}
            disabled={saving || !!deleteBlockReason}
          >
            {saving ? 'Deleting...' : 'Delete user'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
