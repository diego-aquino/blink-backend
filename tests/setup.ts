import 'express-async-errors';

import { afterAll, beforeAll } from 'vitest';

import environment from '@/config/environment';
import { generateSchemaName } from './utils/database';
import database from '@/database/client';

let testSchemaName: string;

beforeAll(async (context) => {
  const testFilePath = context.name;
  testSchemaName = generateSchemaName(testFilePath);

  const testDatabaseURL = environment.DATABASE_URL.replace('schema=public', `schema=${testSchemaName}`);

  environment.DATABASE_URL = testDatabaseURL;
  process.env.DATABASE_URL = testDatabaseURL;

  database.initialize(testDatabaseURL);

  await database.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}";`);
  await database.client.$executeRawUnsafe(`SET search_path TO "${testSchemaName}";`);

  const { execa: $ } = await import('execa');

  await $`npx dotenv -v DATABASE_URL=${testDatabaseURL} -- npm --silent run migration:apply --skip-generate`;
});

afterAll(async () => {
  await database.client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE;`);
});
