import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'] as const),
  HOSTNAME: z.string(),
  PORT: z.coerce.number().int().positive(),
  HTTPS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string(),
  JWT_ACCESS_DURATION_IN_MINUTES: z.coerce.number(),
  JWT_REFRESH_DURATION_IN_MINUTES: z.coerce.number(),
});

const environment = environmentSchema.parse(process.env);

export default environment;
