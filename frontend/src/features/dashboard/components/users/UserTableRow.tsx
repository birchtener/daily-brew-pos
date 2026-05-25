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

interface UserTableRowProps {
  user: UpdatedUser;
  onEdit: (user: UpdatedUser) => void;
  onDelete: (user: UpdatedUser) => void;
}

export default function UserTableRow({
  user,
  onEdit,
  onDelete,
}: UserTableRowProps) {
  return (
    <tr
      className="border-t border-border bg-card hover:bg-card/60 transition-colors select-none cursor-context-menu"
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
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback className="rounded-lg text-[10px]">
              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-muted-foreground">@{user.username}</td>
      <td className="px-3 py-2 uppercase font-medium text-xs text-card-foreground">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
          user.role === 'admin' 
            ? 'bg-primary/10 text-primary border border-primary/20' 
            : 'bg-muted text-muted-foreground border border-border'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {user.is_password_temp ? (
          <span className="text-emerald-600 font-semibold">Yes</span>
        ) : (
          <span>No</span>
        )}
      </td>
      <td className="px-3 py-2 text-right select-none">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              type="button"
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
      </td>
    </tr>
  );
}
