import type { ParsedUser } from '@/types/userTypes';
import type { UpdatedUser } from '@/api/users';

export function syncStoreFromBackend(
  updated: UpdatedUser,
  setUser: (u: ParsedUser) => void
) {
  setUser({
    id: updated.id,
    username: updated.username,
    role: updated.role,
    first_name: updated.first_name,
    last_name: updated.last_name,
    avatar_url: updated.avatar_url,
    is_password_temp: updated.is_password_temp,
  });
}
