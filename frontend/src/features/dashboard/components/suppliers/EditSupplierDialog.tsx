import { Edit3, LoaderCircle, X } from 'lucide-react';
import type { Supplier } from '@/api/suppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditSupplierDialogProps {
  open: boolean;
  supplier: Supplier | null;
  formName: string;
  formContactName: string;
  formContactNumber: string;
  submitting: boolean;
  onClose: () => void;
  onFormNameChange: (val: string) => void;
  onFormContactNameChange: (val: string) => void;
  onFormContactNumberChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditSupplierDialog({
  open,
  supplier,
  formName,
  formContactName,
  formContactNumber,
  submitting,
  onClose,
  onFormNameChange,
  onFormContactNameChange,
  onFormContactNumberChange,
  onSubmit,
}: EditSupplierDialogProps) {
  if (!open || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit3 className="size-5 text-primary" /> Edit Supplier Details
          </h2>
          <button 
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">
              Supplier / Company Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="Company Name"
              className="h-10 text-sm"
              maxLength={100}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">
              Contact Person Name
            </label>
            <Input
              value={formContactName}
              onChange={(e) => onFormContactNameChange(e.target.value)}
              placeholder="Contact Person Name"
              className="h-10 text-sm"
              maxLength={50}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">
              Contact Phone Number
            </label>
            <Input
              value={formContactNumber}
              onChange={(e) => onFormContactNumberChange(e.target.value)}
              placeholder="Phone number"
              className="h-10 text-sm font-mono"
              maxLength={15}
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
              disabled={submitting || !formName.trim()}
              className="h-9 px-4 text-xs font-semibold"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
