import 'express-async-errors';

import { afterAll, beforeAll, expect } from 'vitest';

import environment from '@/config/environment';
import { clearDatabase, generateWorkerSchemaName } from './utils/database';
import database from '@/database/client';

const VITEST_WORKER_ID = process.env.VITEST_WORKER_ID!;
expect(VITEST_WORKER_ID).toBeTruthy();

const testSchemaName = generateWorkerSchemaName(VITEST_WORKER_ID);

beforeAll(async () => {
  const testDatabaseURL = environment.DATABASE_URL.replace('schema=public', `schema=${testSchemaName}`);
  const isTestSchemaPrepared = environment.DATABASE_URL === testDatabaseURL;

  if (isTestSchemaPrepared) {
    return;
  }

  database.initialize(testDatabaseURL);

  await database.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}";`);
  await database.client.$executeRawUnsafe(`SET search_path TO "${testSchemaName}";`);

  const { execa: $ } = await import('execa');

  await $`npx dotenv -v DATABASE_URL=${testDatabaseURL} -- npm --silent run migration:apply --skip-generate`;

  process.env.DATABASE_URL = testDatabaseURL;
  environment.DATABASE_URL = testDatabaseURL;
});

afterAll(async () => {
  await clearDatabase();
});
