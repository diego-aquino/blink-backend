import crypto from 'crypto';

import database from '@/database/client';

export function generateSchemaName(fileName: string) {
  const hashedFileName = crypto.createHash('shake256', { outputLength: 20 }).update(fileName).digest('hex');
  return `test_${hashedFileName}`;
}

export async function clearDatabase() {
  await database.blink.deleteMany();
  await database.workspaceMember.deleteMany();
  await database.userSession.deleteMany();
  await database.user.deleteMany();
  await database.workspace.deleteMany();
}
