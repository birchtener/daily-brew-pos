import { z } from 'zod';

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;

  return undefined;
};

export const NotificationsListQuerySchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
  perPage: z.preprocess((v) => Number(v), z.number().int().positive().max(100)).optional(),
  unreadOnly: z.preprocess(parseBoolean, z.boolean()).optional(),
});

export const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  link: z.string().max(255).optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});
