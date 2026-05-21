import { prisma } from '../../config/db';
import { LogCategory, LogType } from '../../generated/prisma/client';

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
      await prisma.log.create({
        data: {
          log: message,
          category,
          log_type: type,
          user_id: userId,
        },
      });
    } catch (error) {
      console.error('CRITICAL: Failed to write database log trace:', error);
      console.error(`Original log message: [${category}] [${type}] ${message}`);
    }
  }
}