import { TestSchemaCache } from './utils/database';

async function globalSetup() {
  const schemaCache = new TestSchemaCache();
  await schemaCache.markAllAsNotReady();
}

export default globalSetup;
