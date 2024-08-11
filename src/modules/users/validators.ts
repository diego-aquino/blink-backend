import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const getUserByIdSchema = z.object({
  userId: z.string().min(1),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
