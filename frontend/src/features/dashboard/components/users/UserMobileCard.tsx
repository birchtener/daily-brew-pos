import { MoreHorizontal, PencilLine, Trash2 } from 'lucide-react';
import type { UpdatedUser } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface UserMobileCardProps {
  user: UpdatedUser;
  onEdit: (user: UpdatedUser) => void;
  onDelete: (user: UpdatedUser) => void;
}

export default function UserMobileCard({
  user,
  onEdit,
  onDelete,
}: UserMobileCardProps) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col gap-3 hover:bg-muted/10 transition-colors select-none cursor-context-menu"
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 shrink-0 rounded-lg">
            <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback className="rounded-lg text-xs">
              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate text-sm">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
        </div>

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-muted/80 action-btn-trigger shrink-0"
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

          <ContextMenuContent className="w-44 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
            <ContextMenuItem
              onSelect={() => onEdit(user)}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
            >
              <PencilLine className="size-3.5 text-muted-foreground" />
              Edit details
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => onDelete(user)}
              className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              Delete user
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-2">
        <div>
          <p className="text-muted-foreground">Role</p>
          <p className="mt-1 font-semibold uppercase text-card-foreground">{user.role}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Temp Password</p>
          <p className="mt-1 font-semibold text-card-foreground">
            {user.is_password_temp ? (
              <span className="text-amber-600 dark:text-amber-400">Yes</span>
            ) : (
              <span>No</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
