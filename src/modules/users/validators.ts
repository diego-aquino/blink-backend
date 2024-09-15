import { z } from 'zod';

export const userCreationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type UserCreationInput = z.infer<typeof userCreationSchema>;

export const userByIdSchema = z.object({
  userId: z.string().min(1),
});

export type UserByIdInput = z.infer<typeof userByIdSchema>;

export const userUpdateSchema = userByIdSchema.extend({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
