import { Edit3, X } from 'lucide-react';
import type { Discount } from '@/api/discounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DiscountsFeedbackBanner from './DiscountsFeedbackBanner';
import type { FeedbackState } from './types';

interface EditDiscountDialogProps {
  open: boolean;
  discount: Discount | null;
  formCode: string;
  formName: string;
  formPercentage: string;
  submitting: boolean;
  modalFeedback: FeedbackState;
  onClose: () => void;
  onFormCodeChange: (value: string) => void;
  onFormNameChange: (value: string) => void;
  onFormPercentageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditDiscountDialog({
  open,
  discount,
  formCode,
  formName,
  formPercentage,
  submitting,
  modalFeedback,
  onClose,
  onFormCodeChange,
  onFormNameChange,
  onFormPercentageChange,
  onSubmit,
}: EditDiscountDialogProps) {
  if (!open || !discount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit3 className="size-5 text-primary" /> Configure Promo Discount
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
              className="h-10 text-sm font-mono"
              disabled={submitting}
              required
            />
          </div>

          {modalFeedback && <DiscountsFeedbackBanner feedback={modalFeedback} />}

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
              disabled={submitting}
              className="h-9 px-4 text-xs font-semibold"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
