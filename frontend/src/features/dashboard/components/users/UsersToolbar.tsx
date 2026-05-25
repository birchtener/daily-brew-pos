import { Search, RefreshCw, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UsersToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  role: 'all' | 'admin' | 'staff';
  onRoleChange: (val: 'all' | 'admin' | 'staff') => void;
  loading: boolean;
  onRefresh: () => void;
  error: string | null;
  notice: string | null;
}

export default function UsersToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  loading,
  onRefresh,
  error,
  notice,
}: UsersToolbarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search username or name"
            className="pl-9"
          />
        </div>

        <Select
          value={role}
          onValueChange={(val) => onRoleChange(val as 'all' | 'admin' | 'staff')}
        >
          <SelectTrigger className="h-9 min-w-38 text-xs font-semibold bg-background border border-border shadow-none shrink-0 text-card-foreground text-left">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          <Check className="mt-0.5 size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}
