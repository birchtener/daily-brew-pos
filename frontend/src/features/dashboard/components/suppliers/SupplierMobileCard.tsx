import { Calendar, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import type { Supplier } from '@/api/suppliers';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface SupplierMobileCardProps {
  supplier: Supplier;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export default function SupplierMobileCard({
  supplier,
  isAdmin,
  onEdit,
  onDelete,
}: SupplierMobileCardProps) {
  const updatedAt = new Date(supplier.updated_at);
  const initials = supplier.name
    ? supplier.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '??';

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-context-menu"
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
      {/* Column 1: Avatar, Name, Updated date */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 select-none">
          {initials}
        </div>
        <div className="min-w-0 flex flex-col gap-1">
          <span className="font-semibold text-card-foreground truncate text-sm">{supplier.name}</span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Calendar className="size-3 text-muted-foreground/70" />
            <span>{updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Column 2: Contact Info, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          {supplier.contact_name ? (
            <p className="text-xs font-semibold text-foreground truncate max-w-28">
              {supplier.contact_name}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 italic">No contact</p>
          )}
          {supplier.contact_number ? (
            <a
              href={`tel:${supplier.contact_number}`}
              className="text-[11px] font-mono font-medium text-primary hover:underline block"
            >
              {supplier.contact_number}
            </a>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 italic">No phone</p>
          )}
        </div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-muted/85 action-btn-trigger shrink-0"
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
              <MoreHorizontal className="size-4" />
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
      </div>
    </div>
  );
}
