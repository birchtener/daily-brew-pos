import { AlertCircle, Trash2, X } from 'lucide-react';

import type { Category } from '@/api/categories';
import { Button } from '@/components/ui/button';

interface DeleteCategoryDialogProps {
  category: Category | null;
  productCount: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (categoryId: string) => void;
}

export default function DeleteCategoryDialog({
  category,
  productCount,
  submitting,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  if (!category) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3.5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-destructive">
            <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
          </h2>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1 text-left">
          <p className="text-sm text-card-foreground">
            Are you absolutely sure you want to permanently delete the category{' '}
            <span className="font-bold text-foreground">"{category.name}"</span>?
          </p>

          {productCount > 0 ? (
            <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>CRITICAL DANGER:</strong> There are currently <strong>{productCount} product(s)</strong>{' '}
                registered inside this category. If you proceed, <strong>all of these products, along with their ingredient formulas/recipes</strong>, will be permanently deleted from the database.
              </span>
            </div>
          ) : (
            <div className="flex gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                This category is currently empty. Deleting it will safely remove the category container with zero item cascade drops.
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
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
            onClick={() => onConfirm(category.id)}
            disabled={submitting}
            variant="destructive"
            className="h-9 px-4 text-xs font-semibold"
          >
            {submitting ? 'Deleting…' : 'Delete Category'}
          </Button>
        </div>
      </div>
    </div>
  );
}