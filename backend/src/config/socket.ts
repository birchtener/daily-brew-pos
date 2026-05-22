import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { globalEventBus, APP_EVENTS } from './events';

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

  io.on('connection', (socket) => {
    socket.on('join_admin_logs', () => {
      socket.join('admin_logs_room');
    });

    socket.on('join_staff_alerts', () => {
      socket.join('staff_alerts_room');
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