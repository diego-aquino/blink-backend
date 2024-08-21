import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'] as const),
  HOSTNAME: z.string(),
  PORT: z.coerce.number().int().positive(),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string(),
  JWT_ACCESS_DURATION: z.string().regex(/^\d+m$/),
  JWT_REFRESH_DURATION: z.string().regex(/^\d+d$/),
});

const environment = environmentSchema.parse(process.env);

export default environment;
