import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './features/auth/LoginPage';
import { AuthGuard } from './features/auth/components/AuthGuard';
import DashboardLayout from './features/dashboard/layouts/DashboardLayout';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import PosTerminalPage from './features/dashboard/pages/PosTerminalPage';
import ProductsPage from './features/dashboard/pages/ProductsPage';
import InventoryPage from './features/dashboard/pages/InventoryPage';
import SuppliersPage from './features/dashboard/pages/SuppliersPage';
import SettingsPage from './features/dashboard/pages/SettingsPage';
import { useStore } from '@/store/useStore';

export default function App() {
  const { dark } = useStore();

  return (
    <div className={`${dark ? 'dark' : ''} text-primary`}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="pos-terminal" element={<PosTerminalPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
