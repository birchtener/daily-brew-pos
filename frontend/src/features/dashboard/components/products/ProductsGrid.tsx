import { AlertCircle, Coffee } from 'lucide-react';
import type { Product } from '@/api/products';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';

interface ProductsGridProps {
  products: Product[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  expandedProducts: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRetry: () => void;
}

export default function ProductsGrid({
  products,
  totalCount,
  loading,
  error,
  isAdmin,
  expandedProducts,
  onToggleExpand,
  onEdit,
  onDelete,
  onRetry,
}: ProductsGridProps) {
  if (loading && totalCount === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-border bg-card overflow-hidden h-80 flex flex-col justify-between p-4">
            <div className="h-40 bg-muted rounded-xl w-full" />
            <div className="flex flex-col gap-2 mt-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-8 bg-muted rounded-xl w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 border border-border bg-card rounded-xl">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="size-8 animate-bounce" />
          <p className="font-semibold">Failed to load product catalog</p>
          <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl">
        <div className="flex flex-col items-center justify-center gap-3">
          <Coffee className="size-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              {totalCount === 0
                ? 'Create your first product item to get started!'
                : 'Try modifying your filter or search query.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isAdmin={isAdmin}
          isExpanded={!!expandedProducts[product.id]}
          onToggleExpand={() => onToggleExpand(product.id)}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
        />
      ))}
    </div>
  );
}
