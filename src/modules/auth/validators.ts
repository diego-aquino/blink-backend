import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshAuthSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshAuthInput = z.infer<typeof refreshAuthSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const logoutSchema = z.object({
  sessionId: z.string().min(1),
});

export type LogoutInput = z.infer<typeof logoutSchema>;
