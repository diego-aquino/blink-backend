import 'express-async-errors';

import { afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

import { setDatabase } from '@/database/client';
import environment from '@/config/environment';
import { generateSchemaName } from './utils/database.js';

let testSchemaName: string;
let testDatabase: PrismaClient;

beforeAll(async (context) => {
  const testFilePath = context.name;
  testSchemaName = generateSchemaName(testFilePath);

  const testDatabaseURL = environment.DATABASE_URL.replace('schema=public', `schema=${testSchemaName}`);

  testDatabase = new PrismaClient({
    datasources: { db: { url: testDatabaseURL } },
  });
  setDatabase(testDatabase);

  await testDatabase.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}";`);
  await testDatabase.$executeRawUnsafe(`SET search_path TO "${testSchemaName}";`);

  const { execa: $ } = await import('execa');

  await $`npx dotenv -v DATABASE_URL=${testDatabaseURL} -- npm --silent run migration:apply --skip-generate`;
});

afterAll(async () => {
  await testDatabase.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE;`);
});
