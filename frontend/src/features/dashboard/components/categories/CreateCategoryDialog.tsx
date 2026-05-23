import type { FormEvent } from 'react';

import { LoaderCircle, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateCategoryDialogProps {
  open: boolean;
  newCatName: string;
  submitting: boolean;
  onClose: () => void;
  onNewCatNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function CreateCategoryDialog({
  open,
  newCatName,
  submitting,
  onClose,
  onNewCatNameChange,
  onSubmit,
}: CreateCategoryDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3.5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Plus className="size-5 text-primary" /> Create Category
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-card-foreground">Category Name</label>
            <Input
              value={newCatName}
              onChange={(event) => onNewCatNameChange(event.target.value)}
              placeholder="e.g., Cold Brew Infusions"
              className="h-10 text-sm"
              maxLength={50}
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 px-4 text-xs font-medium">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !newCatName.trim()}
              className="inline-flex h-9 px-4 text-xs font-semibold"
            >
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}