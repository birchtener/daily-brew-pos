import { Search } from 'lucide-react';
import type { Category } from '@/api/categories';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductsToolbarProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  categories: Category[];
  filteredCount: number;
  totalCount: number;
}

export default function ProductsToolbar({
  searchVal,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  filteredCount,
  totalCount,
}: ProductsToolbarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchVal}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title or category..."
            className="pl-9 w-full h-9 text-sm"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={onCategoryFilterChange}
        >
          <SelectTrigger className="h-9 w-44 text-xs font-medium bg-background border border-border shadow-none shrink-0">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground select-none shrink-0">
        Showing <span className="font-semibold text-card-foreground">{filteredCount}</span> of {totalCount} products
      </div>
    </div>
  );
}
