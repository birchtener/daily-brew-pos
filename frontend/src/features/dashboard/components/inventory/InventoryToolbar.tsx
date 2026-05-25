 
import { Search, Plus, Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  ingredientSearch: string;
  setIngredientSearch: (v: string) => void;
  filteredCount: number;
  totalCount: number;
  isAdmin: boolean;
  onAddIngredient: () => void;
  onAdjustStock?: () => void;
};

export default function InventoryToolbar({
  ingredientSearch,
  setIngredientSearch,
  filteredCount,
  totalCount,
  isAdmin,
  onAddIngredient,
  onAdjustStock,
 }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={ingredientSearch}
          onChange={(e) => setIngredientSearch(e.target.value)}
          placeholder="Search ingredients by name..."
          className="pl-9 w-full h-9 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground select-none">
          Showing <span className="font-semibold text-card-foreground">{filteredCount}</span> of {totalCount}
        </div>
        {onAdjustStock && (
          <Button
            onClick={onAdjustStock}
            variant="outline"
            className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 border-border hover:bg-muted"
          >
            <Scale className="size-4" /> Reduce Stock
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={onAddIngredient}
            className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Add Ingredient
          </Button>
        )}
      </div>
    </div>
  );
}
