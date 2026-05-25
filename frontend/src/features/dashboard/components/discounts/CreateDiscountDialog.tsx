import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateDiscountDialogProps {
  open: boolean;
  formCode: string;
  formName: string;
  formPercentage: string;
  submitting: boolean;
  onClose: () => void;
  onFormCodeChange: (value: string) => void;
  onFormNameChange: (value: string) => void;
  onFormPercentageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateDiscountDialog({
  open,
  formCode,
  formName,
  formPercentage,
  submitting,
  onClose,
  onFormCodeChange,
  onFormNameChange,
  onFormPercentageChange,
  onSubmit,
}: CreateDiscountDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="size-5 text-primary" /> Create Discount
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 text-left"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-card-foreground uppercase">
              Promo Code
            </label>
            <Input
              value={formCode}
              onChange={(e) => onFormCodeChange(e.target.value)}
              placeholder="e.g., DAILYBREW20"
              className="h-10 text-sm font-mono uppercase"
              maxLength={50}
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-card-foreground uppercase">
              Campaign Name
            </label>
            <Input
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="e.g., Anniversary Promo"
              className="h-10 text-sm"
              maxLength={50}
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-card-foreground uppercase">
              Deduction Percentage (%)
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={formPercentage}
              onChange={(e) => onFormPercentageChange(e.target.value)}
              placeholder="e.g., 20"
              className="h-10 text-sm font-mono"
              disabled={submitting}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
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
              type="submit"
              disabled={
                submitting ||
                !formCode.trim() ||
                !formName.trim() ||
                !formPercentage
              }
              className="h-9 px-4 text-xs font-semibold"
            >
              {submitting ? 'Saving…' : 'Add Discount'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
