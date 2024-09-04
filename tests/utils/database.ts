import filesystem from 'fs';
import database from '@/database/client';
import path from 'path';
import { pathExists } from '@/utils/files';

export function generateTestSchemaName(workerId: number) {
  return `test_worker_${workerId}`;
}

export class TestSchemaCache {
  private readonly CACHE_DIRECTORY = path.join(__dirname, '.cache', 'ready-test-schemas');

  async markAsReady(workerId: number, isReady: boolean) {
    const readyFile = this.getReadyTestSchemaFile(workerId);

    if (isReady) {
      await filesystem.promises.mkdir(path.dirname(readyFile), { recursive: true });
      await filesystem.promises.writeFile(readyFile, '');
    } else {
      await filesystem.promises.rm(readyFile, { force: true });
    }
  }

  async markAllAsUnready() {
    await filesystem.promises.rm(this.CACHE_DIRECTORY, {
      recursive: true,
      force: true,
    });
  }

  isReady(workerId: number) {
    const readyFile = this.getReadyTestSchemaFile(workerId);
    return pathExists(readyFile);
  }

  private getReadyTestSchemaFile(workerId: number) {
    return path.join(this.CACHE_DIRECTORY, generateTestSchemaName(workerId));
  }
}

export async function clearDatabase() {
  await database.client.blink.deleteMany();
  await database.client.workspaceMember.deleteMany();
  await database.client.userSession.deleteMany();
  await database.client.user.deleteMany();
  await database.client.workspace.deleteMany();
}
