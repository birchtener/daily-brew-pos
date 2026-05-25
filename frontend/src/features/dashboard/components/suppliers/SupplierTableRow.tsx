import { 
  Building2, 
  User, 
  Phone, 
  Calendar, 
  MoreHorizontal, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import type { Supplier } from '@/api/suppliers';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface SupplierTableRowProps {
  supplier: Supplier;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export default function SupplierTableRow({
  supplier,
  isAdmin,
  onEdit,
  onDelete,
}: SupplierTableRowProps) {
  const updatedAt = new Date(supplier.updated_at);

  return (
    <tr 
      className="hover:bg-muted/40 transition-colors select-none cursor-context-menu"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.currentTarget.querySelector('.action-btn-trigger');
        if (btn) {
          const event = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: e.clientX,
            clientY: e.clientY,
          });
          btn.dispatchEvent(event);
        }
      }}
    >
      {/* Vendor Name */}
      <td className="p-4 font-semibold text-card-foreground">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
            <Building2 className="size-4.5" />
          </div>
          <span className="truncate">{supplier.name}</span>
        </div>
      </td>

      {/* Contact Person */}
      <td className="p-4 text-muted-foreground">
        {supplier.contact_name ? (
          <div className="flex items-center gap-2 text-foreground font-medium">
            <User className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">{supplier.contact_name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/50 text-xs italic select-none">Not Specified</span>
        )}
      </td>

      {/* Contact Phone */}
      <td className="p-4 text-muted-foreground text-left">
        {supplier.contact_number ? (
          <a 
            href={`tel:${supplier.contact_number}`}
            className="flex items-center gap-2 hover:text-primary transition font-mono whitespace-nowrap text-xs md:text-sm font-medium"
          >
            <Phone className="size-4 text-muted-foreground shrink-0" />
            <span>{supplier.contact_number}</span>
          </a>
        ) : (
          <span className="text-muted-foreground/50 text-xs italic select-none">Not Specified</span>
        )}
      </td>

      {/* Date Stamp */}
      <td className="p-4 hidden lg:table-cell text-xs font-mono text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground/70" />
          <span>{updatedAt.toLocaleDateString()}</span>
        </div>
      </td>

      {/* Action Button Context Menu */}
      <td className="p-4 text-center select-none">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-muted/80 action-btn-trigger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const event = new MouseEvent('contextmenu', {
                  bubbles: true,
                  cancelable: true,
                  clientX: e.clientX,
                  clientY: e.clientY,
                });
                e.currentTarget.dispatchEvent(event);
              }}
            >
              <MoreHorizontal className="size-4.5" />
            </Button>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
            <ContextMenuItem 
              onSelect={() => onEdit(supplier)}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Edit3 className="size-3.5 text-muted-foreground" />
              Edit Details
            </ContextMenuItem>
            {isAdmin && (
              <ContextMenuItem 
                onSelect={() => onDelete(supplier)}
                className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Delete Supplier
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </td>
    </tr>
  );
}
