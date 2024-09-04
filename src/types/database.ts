import { PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

export interface TransactionOptions {
  transaction?: Omit<PrismaClient, ITXClientDenyList>;
}
