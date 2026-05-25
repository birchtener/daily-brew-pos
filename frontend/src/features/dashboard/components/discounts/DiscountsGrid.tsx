import { AlertCircle, Ticket } from 'lucide-react';
import type { Discount } from '@/api/discounts';
import type { UpdatedUser } from '@/api/users';
import { Button } from '@/components/ui/button';
import DiscountCard from './DiscountCard';

interface DiscountsGridProps {
  discounts: Discount[];
  users: UpdatedUser[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  isAdmin: boolean;
  onRetry: () => void;
  onEditStart: (discount: Discount) => void;
  onDeleteStart: (discount: Discount) => void;
}

export default function DiscountsGrid({
  discounts,
  users,
  loading,
  error,
  totalCount,
  isAdmin,
  onRetry,
  onEditStart,
  onDeleteStart,
}: DiscountsGridProps) {
  const getCreatorLabel = (creatorId: string) => {
    if (!creatorId || creatorId === 'system') return 'System';
    const match = users.find((user) => user.id === creatorId);
    return match
      ? `${match.first_name} ${match.last_name} (@${match.username})`
      : creatorId;
  };

  if (loading && totalCount === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-border bg-card p-4"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-rose-500">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="size-8 animate-bounce" />
          <p className="font-semibold">Failed to load discounts catalog</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (discounts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-3">
          <Ticket className="size-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-foreground">No promo codes found</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {totalCount === 0
                ? 'Create your first discount code to start applying discounts in the terminal!'
                : 'Try modifying your search query.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {discounts.map((discount) => (
        <DiscountCard
          key={discount.id}
          discount={discount}
          isAdmin={isAdmin}
          creatorLabel={getCreatorLabel(discount.created_by)}
          onEditStart={onEditStart}
          onDeleteStart={onDeleteStart}
        />
      ))}
    </div>
  );
}
