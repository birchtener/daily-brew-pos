import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuppliersHeaderProps {
  isAdmin: boolean;
  onAddClick: () => void;
}

export default function SuppliersHeader({ isAdmin, onAddClick }: SuppliersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Suppliers Registry</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage vendor details, coordinate supplier contacts, and inspect procurement relations.
        </p>
      </div>

      {isAdmin && (
        <Button 
          onClick={onAddClick} 
          className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="size-4" /> Add Supplier
        </Button>
      )}
    </div>
  );
}
