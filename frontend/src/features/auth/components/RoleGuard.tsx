import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { ParsedUser } from '@/types/userTypes';

type AllowedRole = ParsedUser['role'];

export function RoleGuard({ allowedRoles, redirectTo = '/' }: { allowedRoles: AllowedRole[]; redirectTo?: string }) {
  const user = useStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}