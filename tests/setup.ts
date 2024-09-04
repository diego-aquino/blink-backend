import 'express-async-errors';

import { afterAll, beforeAll, expect } from 'vitest';

import environment from '@/config/environment';
import { clearDatabase, generateTestSchemaName, TestSchemaCache } from './utils/database';
import database from '@/database/client';
import path from 'path';

const testWorkerId = Number(process.env.VITEST_POOL_ID!);
expect(testWorkerId).not.toBeNaN();

const PRISMA_CLI_SCRIPT_PATH = path.join('node_modules', 'prisma', 'build', 'index.js');

const schemaCache = new TestSchemaCache();

beforeAll(async () => {
  const testSchemaName = generateTestSchemaName(testWorkerId);
  const testDatabaseURL = environment.DATABASE_URL.replace('schema=public', `schema=${testSchemaName}`);

  await database.initialize(testDatabaseURL);

  const canSkipSchemaSetup = await schemaCache.isReady(testWorkerId);
  if (canSkipSchemaSetup) {
    return;
  }

  await database.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}";`);
  await database.client.$executeRawUnsafe(`SET search_path TO "${testSchemaName}";`);

  const { execa: $ } = await import('execa');

  await $('node', [PRISMA_CLI_SCRIPT_PATH, 'migrate', 'deploy'], {
    env: { DATABASE_URL: testDatabaseURL },
  });

  process.env.DATABASE_URL = testDatabaseURL;
  environment.DATABASE_URL = testDatabaseURL;

  await schemaCache.markAsReady(testWorkerId, true);
});

afterAll(async () => {
  await clearDatabase();
});
