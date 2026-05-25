import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedbackState } from '@/features/dashboard/pages/InventoryPage';
import type { Batch } from '@/api/batches';

type Props = {
  item: Batch | null;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  feedback: FeedbackState | null;
};

export default function DeleteBatchDialog({ item, onClose, onConfirm, submitting, feedback }: Props) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
            <Trash2 className="size-5 shrink-0" /> Delete Unused Batch
          </h2>
          <button onClick={onClose} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1">
          <p className="text-sm text-card-foreground">
            Remove the stock batch for <span className="font-bold text-foreground">"{item.ingredient.name}"</span> received from <span className="font-bold text-foreground">{item.supplier_order.supplier.name}</span>?
          </p>
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground font-mono">
            Qty: {Number(item.quantity_received).toFixed(1)} {item.ingredient.unit} · Cost/Unit: ₱{Number(item.cost_per_unit).toFixed(2)} · Expiry: {new Date(item.expiry).toLocaleDateString()}
          </div>
        </div>

        {feedback && <div className="mt-4">{feedback.message}</div>}

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
          <Button onClick={onConfirm} disabled={submitting} variant="destructive" className="h-9 px-4 text-xs font-semibold">
            {submitting ? 'Deleting…' : 'Delete Batch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
