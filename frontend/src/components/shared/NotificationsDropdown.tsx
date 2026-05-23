// import { useEffect, useState } from 'react';
// import { Bell } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import {
//   listNotifications,
//   type NotificationItem,
// } from '@/api/notifications';

// export default function NotificationsDropdown() {
//   const [items, setItems] = useState<NotificationItem[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const refresh = async () => {
//     setLoading(true);
//     try {
//       const data = await listNotifications({ page: 1, perPage: 10 });
//       setItems(data.items);
//       setUnreadCount(data.unreadCount);
//     } catch {
//       setItems([]);
//       setUnreadCount(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void refresh();
//   }, []);

//   return (
//     <Button type="button" variant="outline" className="relative" onClick={() => navigate('/notifications')}>
//       <Bell className="size-4" />
//       {unreadCount > 0 && (
//         <span className="absolute -right-2 -top-2 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
//           {unreadCount > 99 ? '99+' : unreadCount}
//         </span>
//       )}
//       {loading && <span className="sr-only">Loading notifications</span>}
//     </Button>
//   );
// }

export default function NotificationsDropdown() {
  return (<></>)
}