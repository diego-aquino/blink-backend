import { z } from 'zod';

export const redirectByIdSchema = z.object({
  redirectId: z.string().min(1),
});

export type RedirectByIdInput = z.infer<typeof redirectByIdSchema>;
