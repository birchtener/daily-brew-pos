import { X, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedbackState } from '@/features/dashboard/pages/InventoryPage';
import type { Ingredient } from '@/api/ingredients';

type Props = {
  item: Ingredient | null;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  feedback: FeedbackState | null;
};

export default function DeleteIngredientDialog({ item, onClose, onConfirm, submitting, feedback }: Props) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
          </h2>
          <button onClick={onClose} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1">
          <p className="text-sm text-card-foreground">
            Are you absolutely sure you want to permanently delete <span className="font-bold text-foreground">"{item.name}"</span>?
          </p>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              <strong>CASCADE WARNING:</strong> This will permanently remove all associated stock batches and recipe links. Products that only use this ingredient will also be deleted.
            </span>
          </div>
        </div>

        {feedback && <div className="mt-4">{feedback.message}</div>}

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
          <Button onClick={onConfirm} disabled={submitting} variant="destructive" className="h-9 px-4 text-xs font-semibold">
            {submitting ? 'Deleting…' : 'Delete Ingredient'}
          </Button>
        </div>
      </div>
    </div>
  );
}
