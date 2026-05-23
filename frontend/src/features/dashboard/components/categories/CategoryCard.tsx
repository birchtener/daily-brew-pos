import { Coffee, Edit3, MoreVertical, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category } from '@/api/categories';

interface CategoryCardProps {
  category: Category;
  linkedProductsCount: number;
  isAdmin: boolean;
  isEditing: boolean;
  editingCatName: string;
  submitting: boolean;
  onEditStart: (category: Category) => void;
  onDeleteStart: (category: Category) => void;
  onEditCancel: () => void;
  onEditNameChange: (value: string) => void;
  onEditSave: (categoryId: string) => void;
}

export default function CategoryCard({
  category,
  linkedProductsCount,
  isAdmin,
  isEditing,
  editingCatName,
  submitting,
  onEditStart,
  onDeleteStart,
  onEditCancel,
  onEditNameChange,
  onEditSave,
}: CategoryCardProps) {
  return (
    <div className="group flex h-28 flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      {isEditing ? (
        <div className="flex w-full flex-col gap-2">
          <Input
            value={editingCatName}
            onChange={(event) => onEditNameChange(event.target.value)}
            className="h-8.5 text-xs font-semibold"
            maxLength={50}
            disabled={submitting}
            autoFocus
          />
          <div className="flex items-center gap-2 self-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
              disabled={submitting}
              className="h-7 px-2 text-[10px] text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onEditSave(category.id)}
              disabled={submitting || !editingCatName.trim()}
              className="h-7 px-3 text-[10px] font-semibold"
            >
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold tracking-tight text-foreground" title={category.name}>
                {category.name}
              </h3>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Coffee className="size-3" /> {linkedProductsCount} Product{linkedProductsCount !== 1 ? 's' : ''}
              </span>
            </div>

            {isAdmin && (
              <>
                <div className="flex shrink-0 select-none items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 max-sm:hidden">
                  <button
                    onClick={() => onEditStart(category)}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title="Edit category name"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteStart(category)}
                    className="flex size-7 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-500/10"
                    title="Delete category"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground sm:hidden"
                      aria-label="Category actions"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={() => onEditStart(category)}>
                      <Edit3 className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => onDeleteStart(category)}>
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="border-t border-border/40 pt-2 font-mono text-[10px] text-muted-foreground">
            <span>Updated: {new Date(category.updated_at).toLocaleDateString()}</span>
          </div>
        </>
      )}
    </div>
  );
}