import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshAccessTokenInput = z.infer<typeof refreshAccessTokenSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
