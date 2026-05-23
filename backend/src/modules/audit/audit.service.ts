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

  static async getLogs({
    category,
    type,
    search,
    cursor,
    limit = 20,
  }: {
    category?: LogCategory;
    type?: LogType;
    search?: string;
    cursor?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (category) where.category = category;
    if (type) where.log_type = type;
    if (search) {
      where.OR = [
        {
          log: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          logger: {
            OR: [
              {
                first_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                last_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ];
    }

    const items = await prisma.log.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        logger: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            username: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });

    let hasNextPage = false;
    let nextCursor: number | null = null;

    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
      nextCursor = items[items.length - 1].id;
    }

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }
}