import { AlertCircle, Building2 } from 'lucide-react';
import type { Supplier } from '@/api/suppliers';
import { Button } from '@/components/ui/button';
import SupplierTableRow from './SupplierTableRow';

interface SuppliersTableProps {
  suppliers: Supplier[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onRetry: () => void;
}

export default function SuppliersTable({
  suppliers,
  totalCount,
  loading,
  error,
  isAdmin,
  onEdit,
  onDelete,
  onRetry,
}: SuppliersTableProps) {
  return (
    <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden select-text">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground select-none">
              <th className="p-4 w-62.5 md:w-80">Vendor Name</th>
              <th className="p-4 w-50 md:w-65">Contact Person</th>
              <th className="p-4 w-45 md:w-55">Phone Number</th>
              <th className="p-4 w-37.5 hidden lg:table-cell">Last Updated</th>
              <th className="p-4 w-15 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && totalCount === 0 ? (
              // Skeleton UI Loader
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted shrink-0" />
                      <div className="h-4 bg-muted rounded w-36" />
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                  <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
                  <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-muted rounded w-20" /></td>
                  <td className="p-4 text-center"><div className="size-6 bg-muted rounded mx-auto" /></td>
                </tr>
              ))
            ) : error ? (
              // Error state banner
              <tr>
                <td colSpan={5} className="p-8 text-center text-destructive">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="size-8 animate-bounce" />
                    <p className="font-semibold">Failed to load suppliers list</p>
                    <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
                    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Building2 className="size-10 text-muted-foreground/30" />
                    <div>
                      <p className="font-medium text-foreground">No suppliers found</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        {totalCount === 0 
                          ? 'Add your first supplier vendor to get started!'
                          : 'Try adjusting search terms or register a new vendor.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Row mapping
              suppliers.map((supplier) => (
                <SupplierTableRow
                  key={supplier.id}
                  supplier={supplier}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
