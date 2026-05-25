import { Users, AlertCircle } from 'lucide-react';
import type { UpdatedUser } from '@/api/users';
import { Button } from '@/components/ui/button';
import UserTableRow from './UserTableRow';
import UserMobileCard from './UserMobileCard';

interface UsersListProps {
  users: UpdatedUser[];
  loading: boolean;
  error: string | null;
  onEdit: (user: UpdatedUser) => void;
  onDelete: (user: UpdatedUser) => void;
  onRetry: () => void;
}

export default function UsersList({
  users,
  loading,
  error,
  onEdit,
  onDelete,
  onRetry,
}: UsersListProps) {
  return (
    <div className="w-full">
      {/* Mobile Stacked View */}
      <div className="mt-4 md:hidden overflow-hidden rounded-lg border border-border">
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          {loading && users.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-sm animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                  <div><div className="h-3 bg-muted rounded w-8" /></div>
                  <div><div className="h-3 bg-muted rounded w-10" /></div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-rose-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="size-8 animate-bounce" />
                <p className="font-semibold">Failed to load users list</p>
                <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center justify-center gap-3">
                <Users className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-foreground">No users found</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    Try adjusting search terms or register a new user.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            users.map((user) => (
              <UserMobileCard
                key={user.id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-sm shadow-2xl">
          <thead className="bg-card text-left text-xs uppercase text-muted-foreground select-none">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Temp Password</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted shrink-0" />
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3.5 bg-muted rounded w-24" />
                        <div className="h-2.5 bg-muted rounded w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-muted rounded w-20" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-muted rounded w-12" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-muted rounded w-8" /></td>
                  <td className="px-3 py-2 text-right"><div className="size-6 bg-muted rounded ml-auto" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="size-8 animate-bounce" />
                    <p className="font-semibold">Failed to load users list</p>
                    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Users className="size-10 text-muted-foreground/30" />
                    <div>
                      <p className="font-medium text-foreground">No users found</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        Try adjusting search terms or register a new user.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
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
