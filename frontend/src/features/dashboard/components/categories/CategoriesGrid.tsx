import { AlertCircle, Tag } from 'lucide-react';

import type { Category } from '@/api/categories';
import type { Product } from '@/api/products';
import { Button } from '@/components/ui/button';

import CategoryCard from './CategoryCard';

interface CategoriesGridProps {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  isAdmin: boolean;
  editingCatId: string | null;
  editingCatName: string;
  submitting: boolean;
  onRetry: () => void;
  onEditStart: (category: Category) => void;
  onEditCancel: () => void;
  onEditNameChange: (value: string) => void;
  onEditSave: (categoryId: string) => void;
  onDeleteStart: (category: Category) => void;
}

export default function CategoriesGrid({
  categories,
  products,
  loading,
  error,
  totalCount,
  isAdmin,
  editingCatId,
  editingCatName,
  submitting,
  onRetry,
  onEditStart,
  onEditCancel,
  onEditNameChange,
  onEditSave,
  onDeleteStart,
}: CategoriesGridProps) {
  if (loading && totalCount === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-card p-4"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-destructive">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="size-8 animate-bounce" />
          <p className="font-semibold">Failed to load categories</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-3">
          <Tag className="size-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-foreground">No categories found</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {totalCount === 0
                ? 'Create a category to begin classifying your POS products!'
                : 'Try modifying your search query.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((category) => {
        const isEditing = editingCatId === category.id;
        const linkedProductsCount = products.filter((product) => product.category_id === category.id).length;

        return (
          <CategoryCard
            key={category.id}
            category={category}
            linkedProductsCount={linkedProductsCount}
            isAdmin={isAdmin}
            isEditing={isEditing}
            editingCatName={editingCatName}
            submitting={submitting}
            onEditStart={onEditStart}
            onDeleteStart={onDeleteStart}
            onEditCancel={onEditCancel}
            onEditNameChange={onEditNameChange}
            onEditSave={onEditSave}
          />
        );
      })}
    </div>
  );
}