import { NotFoundError } from '@/errors/http';
import { Workspace } from '@prisma/client';

export class WorkspaceNotFoundError extends NotFoundError {
  constructor(workspaceId: Workspace['id']) {
    super(`Workspace '${workspaceId}' not found.`);
  }
}
