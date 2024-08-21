import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userByIdSchema = z.object({
  userId: z.string().min(1),
});

export type UserByIdInput = z.infer<typeof userByIdSchema>;

export const updateUserSchema = userByIdSchema.extend({
  name: z.string().min(1),
  email: z.string().email(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
