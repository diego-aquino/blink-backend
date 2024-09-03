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

  async initialize(databaseURL = environment.DATABASE_URL) {
    if (this.prisma) {
      const prisma = this.prisma;
      this.prisma = undefined;

      await prisma.$disconnect();
    }

    this.prisma = new PrismaClient({
      datasources: { db: { url: databaseURL } },
    });
  }
}

const database = new Database();

export default database;
