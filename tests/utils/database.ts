import database from '@/database/client';

export function generateTestSchemaName(workerId: string) {
  return `test_worker_${workerId}`;
}

export async function clearDatabase() {
  await database.client.blink.deleteMany();
  await database.client.workspaceMember.deleteMany();
  await database.client.userSession.deleteMany();
  await database.client.user.deleteMany();
  await database.client.workspace.deleteMany();
}
