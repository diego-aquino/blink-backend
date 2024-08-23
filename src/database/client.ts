import environment from '@/config/environment';
import { PrismaClient } from '@prisma/client';

export class Database {
  private prisma: PrismaClient | undefined = undefined;

  get client() {
    if (!this.prisma) {
      throw new Error('Database client is not initialized. Call `database.initialize()` first.');
    }
    return this.prisma;
  }

  initialize(databaseURL = environment.DATABASE_URL) {
    this.prisma = new PrismaClient({
      datasources: { db: { url: databaseURL } },
    });
  }
}

const database = new Database();

export default database;
