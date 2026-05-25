import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SuppliersToolbarProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
  filteredCount: number;
  totalCount: number;
}

export default function SuppliersToolbar({
  searchVal,
  onSearchChange,
  filteredCount,
  totalCount,
}: SuppliersToolbarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchVal}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search suppliers by company or contact name..."
          className="pl-9 w-full h-9 text-sm"
        />
      </div>
      <div className="text-xs text-muted-foreground select-none">
        Showing <span className="font-semibold text-card-foreground">{filteredCount}</span> of {totalCount} vendors
      </div>
    </div>
  );
}
