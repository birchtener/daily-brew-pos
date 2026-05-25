import { X, ImagePlus, Package, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Select as _Select } from '@/components/ui/select';
import type { Unit } from '@/api/ingredients';
import { UNIT_OPTIONS } from '@/features/dashboard/pages/InventoryPage';
import type { FeedbackState } from '@/features/dashboard/pages/InventoryPage';

type Props = {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  unit: Unit;
  setUnit: (v: Unit) => void;
  threshold: string;
  setThreshold: (v: string) => void;
  imagePreview: string | null;
  onImageClick: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  feedback: FeedbackState | null;
};

export default function AddEditIngredientModal({
  mode,
  isOpen,
  onClose,
  name,
  setName,
  unit,
  setUnit,
  threshold,
  setThreshold,
  imagePreview,
  onImageClick,
  onImageChange,
  onClearImage,
  fileInputRef,
  onSubmit,
  submitting,
  feedback,
}: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {mode === 'add' ? <Package className="size-5 text-primary" /> : <X className="size-5 text-primary" />} {mode === 'add' ? 'Add New Ingredient' : 'Edit Ingredient'}
          </h2>
          <button onClick={onClose} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">Image</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onImageClick}
                className="relative size-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-primary transition cursor-pointer overflow-hidden group"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="size-5" />
                    <span className="text-[9px] font-medium">Upload</span>
                  </div>
                )}
              </button>
              {imagePreview && (
                <button type="button" onClick={onClearImage} className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition underline">
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">Ingredient Name <span className="text-destructive">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ingredient Name" className="h-10 text-sm" maxLength={50} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">Unit <span className="text-destructive">*</span></label>
              <Select value={unit} onValueChange={(val) => setUnit(val as Unit)}>
                <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-sm font-medium text-foreground">
                  <SelectValue placeholder="Select unit…" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">Low Stock Alert</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="5.0"
                className="h-10 text-sm font-mono"
              />
            </div>
          </div>

          {feedback && (
            <div className="mt-2">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${feedback.type === 'error' ? 'border border-destructive/20 bg-destructive/10 text-destructive' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'}`}>
                {feedback.message}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
            <Button type="submit" disabled={submitting} className="h-9 px-4 text-xs font-semibold">
              {submitting ? <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Saving…</span> : mode === 'add' ? 'Add Ingredient' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
