import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CategoriesToolbarProps {
  isAdmin: boolean;
  searchVal: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export default function CategoriesToolbar({
  isAdmin,
  searchVal,
  filteredCount,
  totalCount,
  onSearchChange,
  onCreateClick,
}: CategoriesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full min-w-0 flex-1 lg:w-105">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchVal}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search categories by name..."
            className="h-9 w-full pl-9 text-sm"
          />
        </div>

        {isAdmin && (
          <Button type="button" onClick={onCreateClick} className="h-9 gap-1.5 px-4 text-xs font-semibold">
            <Plus className="size-4" /> New Category
          </Button>
        )}
      </div>

      <div className="shrink-0 select-none text-xs text-muted-foreground">
        Showing <span className="font-semibold text-card-foreground">{filteredCount}</span> of {totalCount} categories
      </div>
    </div>
  );
}