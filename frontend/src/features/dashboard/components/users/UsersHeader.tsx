import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UsersHeaderProps {
  itemsCount: number;
  adminsCount: number;
  onAddClick: () => void;
}

export default function UsersHeader({
  itemsCount,
  adminsCount,
  onAddClick,
}: UsersHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage staff and admin accounts.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {itemsCount} users · {adminsCount} admins
        </div>
        <Button type="button" onClick={onAddClick}>
          <Plus className="mr-2 size-4" />
          Add User
        </Button>
      </div>
    </div>
  );
}
