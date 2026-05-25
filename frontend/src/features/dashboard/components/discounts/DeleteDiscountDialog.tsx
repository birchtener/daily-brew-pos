import { AlertCircle, Trash2, X } from 'lucide-react';
import type { Discount } from '@/api/discounts';
import { Button } from '@/components/ui/button';

interface DeleteDiscountDialogProps {
  open: boolean;
  discount: Discount | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDiscountDialog({
  open,
  discount,
  submitting,
  onClose,
  onConfirm,
}: DeleteDiscountDialogProps) {
  if (!open || !discount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1 text-left">
          <p className="text-sm text-card-foreground">
            Are you absolutely sure you want to permanently delete the promo code{' '}
            <span className="font-mono font-bold text-foreground">
              "{discount.code}"
            </span>
            ?
          </p>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              <strong>CRITICAL WARNING:</strong> This action is permanent.
              If this promo code has already been applied to any parked or
              completed order logs, the database will block the deletion to
              preserve order records. Otherwise, it will be dropped
              immediately.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            variant="destructive"
            className="h-9 px-4 text-xs font-semibold"
          >
            {submitting ? 'Deleting…' : 'Delete Promo Code'}
          </Button>
        </div>
      </div>
    </div>
  );
}
