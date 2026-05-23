import { useEffect, useState } from 'react';
import { Bell, RefreshCw, Send } from 'lucide-react';
import {
  createNotification,
  deleteNotification,
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from '@/api/notifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationsPage from './NotificationsPage';

export default function NotificationsAdminPage() {
  return <NotificationsPage />;
}
export default function NotificationsAdminPage() {
