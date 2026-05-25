import { Coffee, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {
  isAdmin: boolean;
  onAddClick: () => void;
}

export default function ProductsHeader({ isAdmin, onAddClick }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Coffee className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure beverages and bakery goods, manage ingredients formulas, and edit retail pricing details.
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            onClick={onAddClick}
            className="h-9 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Add Product
          </Button>
        </div>
      )}
    </div>
  );
}
