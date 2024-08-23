import environment from '@/config/environment';
import { PrismaClient } from '@prisma/client';

let database = new PrismaClient({
  datasources: { db: { url: environment.DATABASE_URL } },
});

export function setDatabase(newDatabase: PrismaClient) {
  database = newDatabase;
}

export default database;
