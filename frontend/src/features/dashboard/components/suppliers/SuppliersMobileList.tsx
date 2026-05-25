import type { Supplier } from '@/api/suppliers';
import SupplierMobileCard from './SupplierMobileCard';

interface SuppliersMobileListProps {
  suppliers: Supplier[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export default function SuppliersMobileList({
  suppliers,
  totalCount,
  loading,
  error,
  isAdmin,
  onEdit,
  onDelete,
}: SuppliersMobileListProps) {
  return (
    <div className="md:hidden flex flex-col gap-3">
      {loading && totalCount === 0 ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted shrink-0" />
              <div className="flex flex-col gap-2">
                <div className="h-3.5 bg-muted rounded w-24" />
                <div className="h-2.5 bg-muted rounded w-12" />
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))
      ) : error ? (
        <div className="p-6 text-center text-rose-500 border border-border bg-card rounded-xl">
          {error}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border bg-card rounded-xl">
          No suppliers found.
        </div>
      ) : (
        suppliers.map((supplier) => (
          <SupplierMobileCard
            key={supplier.id}
            supplier={supplier}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
