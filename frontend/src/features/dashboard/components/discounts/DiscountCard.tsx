import { Edit3, Trash2 } from 'lucide-react';
import type { Discount } from '@/api/discounts';

interface DiscountCardProps {
  discount: Discount;
  isAdmin: boolean;
  creatorLabel: string;
  onEditStart: (discount: Discount) => void;
  onDeleteStart: (discount: Discount) => void;
}

export default function DiscountCard({
  discount,
  isAdmin,
  creatorLabel,
  onEditStart,
  onDeleteStart,
}: DiscountCardProps) {
  return (
    <div className="group flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="truncate font-mono font-black text-foreground text-base tracking-wider"
              title={discount.code}
            >
              {discount.code}
            </h3>
            <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-black text-emerald-600 select-none dark:text-emerald-400">
              {discount.percentage}% OFF
            </span>
          </div>
          <p
            className="mt-1.5 truncate text-xs font-medium text-muted-foreground"
            title={discount.name}
          >
            {discount.name}
          </p>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 select-none items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => onEditStart(discount)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Configure promo discount"
            >
              <Edit3 className="size-3.5" />
            </button>
            <button
              onClick={() => onDeleteStart(discount)}
              className="flex size-7 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
              title="Remove promo code"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-border/40 pt-2 font-mono text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Created by: {creatorLabel}</span>
        <span>
          Updated: {new Date(discount.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
