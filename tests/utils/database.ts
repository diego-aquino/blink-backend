import crypto from 'crypto';

import database from '@/database/client';

export function generateSchemaName(fileName: string) {
  const hashedFileName = crypto.createHash('shake256', { outputLength: 20 }).update(fileName).digest('hex');
  return `test_${hashedFileName}`;
}

export async function clearDatabase() {
  await database.client.blink.deleteMany();
  await database.client.workspaceMember.deleteMany();
  await database.client.userSession.deleteMany();
  await database.client.user.deleteMany();
  await database.client.workspace.deleteMany();
}
