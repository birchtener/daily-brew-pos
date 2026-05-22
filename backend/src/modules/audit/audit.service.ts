import { prisma } from '../../config/db';
import { LogCategory, LogType } from '../../generated/prisma/client';
import { globalEventBus, APP_EVENTS } from '../../config/events';

export class AuditService {
  static async log({
    message,
    category,
    type = LogType.info,
    userId,
  }: {
    message: string;
    category: LogCategory;
    type?: LogType;
    userId: string;
  }): Promise<void> {
    try {
      const newLogRecord = await prisma.log.create({
        data: {
          log: message,
          category,
          log_type: type,
          user_id: userId,
        },
      });

      setImmediate(() => {
        try {
          globalEventBus.emit(APP_EVENTS.AUDIT_LOG_CREATED, newLogRecord);
        } catch (dispatchError) {
          console.error('WARNING: Audit log event dispatch failed:', dispatchError);
        }
      });

    } catch (error) {
      console.error('CRITICAL: Failed to write database log trace:', error);
      console.error(`Original log message: [${category}] [${type}] ${message}`);
    }
  }
}