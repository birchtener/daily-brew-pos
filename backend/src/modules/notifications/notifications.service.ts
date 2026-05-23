import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

type CreateNotificationPayload = {
  title: string;
  body: string;
  link?: string | null;
  user_id?: string | null;
};

type ListOptions = {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
};

export class NotificationsService {
  static async create(payload: CreateNotificationPayload, actorId: string) {
    return prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        link: payload.link ?? null,
        user_id: payload.user_id ?? null,
        created_by: actorId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });
  }

  static async listForUser(userId: string, options: ListOptions) {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.NotificationWhereInput = {
      is_deleted: false,
      ...(options.unreadOnly ? { is_read: false } : {}),
      OR: [{ user_id: userId }, { user_id: null }],
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          is_deleted: false,
          is_read: false,
          OR: [{ user_id: userId }, { user_id: null }],
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
      unreadCount,
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        is_deleted: false,
        OR: [{ user_id: userId }, { user_id: null }],
      },
      data: { is_read: true },
    });

    if (result.count === 0) {
      throw createHttpError('Notification not found.', 404);
    }

    return prisma.notification.findUnique({ where: { id: notificationId } });
  }

  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        is_deleted: false,
        is_read: false,
        OR: [{ user_id: userId }, { user_id: null }],
      },
      data: { is_read: true },
    });

    return { updatedCount: result.count };
  }

  static async softDelete(notificationId: string, userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        is_deleted: false,
        OR: [{ user_id: userId }, { user_id: null }],
      },
      data: { is_deleted: true },
    });

    if (result.count === 0) {
      throw createHttpError('Notification not found.', 404);
    }

    return { deleted: true };
  }
}
