import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'] as const),
  HOSTNAME: z.string(),
  PORT: z.coerce.number().int().positive(),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string(),
});

const environment = environmentSchema.parse(process.env);

export default environment;
