import { EventEmitter } from 'events';

export const globalEventBus = new EventEmitter();

export const APP_EVENTS = {
  AUDIT_LOG_CREATED: 'audit:log_created',
  LOW_STOCK_DETECTED: 'inventory:low_stock',
  INGREDIENTS_CHANGED: 'catalog:ingredients_changed'
} as const;