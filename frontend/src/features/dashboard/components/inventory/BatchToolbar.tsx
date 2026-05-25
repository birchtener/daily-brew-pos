import React from 'react';
import { Search, PackagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ingredient } from '@/api/ingredients';

type Props = {
  batchSearch: string;
  setBatchSearch: (v: string) => void;
  batchIngredientFilter: string;
  setBatchIngredientFilter: (v: string) => void;
  ingredients: Ingredient[];
  filteredCount: number;
  totalCount: number;
  onReceiveStock: () => void;
};

export default function BatchToolbar({
  batchSearch,
  setBatchSearch,
  batchIngredientFilter,
  setBatchIngredientFilter,
  ingredients,
  filteredCount,
  totalCount,
  onReceiveStock,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
            placeholder="Search by ingredient or supplier..."
            className="pl-9 w-full h-9 text-sm"
          />
        </div>
        <Select
          value={batchIngredientFilter || 'all-ingredients'}
          onValueChange={(val) => setBatchIngredientFilter(val === 'all-ingredients' ? '' : val)}
        >
          <SelectTrigger className="h-9 w-40 text-xs font-medium bg-background border border-border shadow-none">
            <SelectValue placeholder="All Ingredients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-ingredients">All Ingredients</SelectItem>
            {ingredients.map((ing) => (
              <SelectItem key={ing.id} value={ing.id}>
                {ing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground select-none">
          Showing <span className="font-semibold text-card-foreground">{filteredCount}</span> of {totalCount}
        </div>
        <Button
          onClick={onReceiveStock}
          className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5"
        >
          <PackagePlus className="size-4" /> Receive Stock
        </Button>
      </div>
    </div>
  );
}
