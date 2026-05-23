import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { globalEventBus, APP_EVENTS } from './events';
import { NotificationsService } from '../modules/notifications/notifications.service';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

export let io: SocketIOServer;

const emitAsync = (handler: () => void) => {
  setImmediate(() => {
    try {
      handler();
    } catch (error) {
      console.error('WARNING: Deferred websocket dispatch failed:', error);
    }
  });
};

export const initWebSocket = (server: HttpServer) => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Authenticate socket connections using same JWT used for HTTP requests.
  io.use(async (socket, next) => {
    try {
      const handshake = socket.handshake;

      // Extract token from auth payload, Authorization header, or cookies
      const tokenFromAuth = (handshake.auth && (handshake.auth as any).token) || undefined;
      const authHeader = (handshake.headers && (handshake.headers.authorization as string)) || undefined;
      const cookieHeader = (handshake.headers && (handshake.headers.cookie as string)) || undefined;

      let token: string | undefined = tokenFromAuth;
      if (!token && authHeader && authHeader.startsWith('Bearer')) token = authHeader.split(' ')[1];
      if (!token && cookieHeader) {
        const cookies = cookieHeader.split(';').reduce<Record<string,string>>((acc, pair) => {
          const idx = pair.indexOf('=');
          if (idx === -1) return acc;
          const key = pair.slice(0, idx).trim();
          const val = pair.slice(idx + 1).trim();
          acc[key] = decodeURIComponent(val);
          return acc;
        }, {});
        token = cookies['daily_brew_access_token'];
      }

      if (!token) {
        return next(new Error('Not authorized (socket): token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
      // attach minimal user info to socket.data
      socket.data.user = { id: decoded.id, username: decoded.username, role: decoded.role };
      return next();
    } catch (err) {
      return next(new Error('Not authorized (socket): invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; role: string } | undefined;
    if (user) {
      // always join personal room
      socket.join(`user_${user.id}`);
      // join staff alerts for both admin and staff
      socket.join('staff_alerts_room');
      // only admins get audit logs
      if (user.role === 'admin') socket.join('admin_logs_room');
    } else {
      // if somehow unauthenticated made it here, disconnect
      socket.disconnect(true);
      return;
    }

    // still allow explicit room joins but enforce permissions
    socket.on('join_admin_logs', () => {
      if (socket.data.user?.role === 'admin') socket.join('admin_logs_room');
    });

    socket.on('join_staff_alerts', () => {
      // any authenticated user can join staff alerts
      if (socket.data.user) socket.join('staff_alerts_room');
    });

    socket.on('join_user', (userId: string) => {
      // allow joining only your own user room (or admins)
      if (!socket.data.user) return;
      if (socket.data.user.id === userId || socket.data.user.role === 'admin') {
        socket.join(`user_${userId}`);
      }
    });
  });

  globalEventBus.on(APP_EVENTS.AUDIT_LOG_CREATED, (logPayload) => {
    emitAsync(() => {
      if (io) {
        io.to('admin_logs_room').emit('new_audit_log', logPayload);
      }
    });
  });

  globalEventBus.on(APP_EVENTS.LOW_STOCK_DETECTED, (alertPayload) => {
    emitAsync(() => {
      if (io) {
        io.to('staff_alerts_room').emit('low_stock_alert', alertPayload);
      }
    });
    // Persist notification to DB and broadcast to staff room
    (async () => {
      try {
        const title = `Low Stocks Alert: ${alertPayload.name}`;
        const body = alertPayload.message || `Low stock detected for ${alertPayload.name}`;

        // Resolve system actor id from env or pick the first admin user
        let systemActorId = process.env.SYSTEM_ACTOR_ID;
        if (!systemActorId) {
          const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
          if (admin) systemActorId = admin.id;
        }
        if (!systemActorId) {
          // Fallback to a non-empty UUID-like string to satisfy DB, but log warning
          console.warn('SYSTEM_ACTOR_ID not set and no admin user found; using fallback actor id.');
          systemActorId = '00000000-0000-0000-0000-000000000000';
        }

        const created = await NotificationsService.create({ title, body, user_id: undefined }, systemActorId);
        emitAsync(() => {
          if (io) io.to('staff_alerts_room').emit('new_notification', created);
        });
      } catch (err) {
        console.error('Failed to persist low stock notification', err);
      }
    })();
  });

  globalEventBus.on(APP_EVENTS.INGREDIENTS_CHANGED, () => {
    emitAsync(() => {
      if (io) {
        io.emit('ingredients_invalidate_cache');
      }
    });
  });

  return io;
};