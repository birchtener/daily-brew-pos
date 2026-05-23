import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './features/auth/LoginPage';
import { AuthGuard } from './features/auth/components/AuthGuard';
import DashboardLayout from './features/dashboard/layouts/DashboardLayout';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import PosTerminalPage from './features/dashboard/pages/PosTerminalPage';
import ProductsPage from './features/dashboard/pages/ProductsPage';
import CategoriesPage from './features/dashboard/pages/CategoriesPage';
import DiscountsPage from './features/dashboard/pages/DiscountsPage';
import InventoryPage from './features/dashboard/pages/InventoryPage';
import SuppliersPage from './features/dashboard/pages/SuppliersPage';
import SettingsPage from './features/dashboard/pages/SettingsPage';
import UsersPage from './features/dashboard/pages/UsersPage.tsx';
import LogsPage from './features/dashboard/pages/LogsPage';
import NotificationsAdminPage from './features/dashboard/pages/NotificationsAdminPage.tsx';
import { useStore } from '@/store/useStore';

export default function App() {
  const { dark } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);

    return () => {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    };
  }, [dark]);

  return (
    <div className="text-primary">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="pos-terminal" element={<PosTerminalPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="notifications-admin" element={<NotificationsAdminPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
