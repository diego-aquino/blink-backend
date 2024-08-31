import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { WorkspaceNotFoundError } from './errors';
import { CreateWorkspaceInput, WorkspaceByIdInput, UpdateWorkspaceInput } from './validators';
import { User, WorkspaceMemberType } from '@prisma/client';

class WorkspaceService {
  private static _instance = new WorkspaceService();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  async create(creatorId: User['id'], input: CreateWorkspaceInput) {
    const workspace = await database.client.workspace.create({
      data: {
        id: createId(),
        name: input.name,
        creatorId,
        members: {
          create: {
            id: createId(),
            userId: creatorId,
            type: 'ADMINISTRATOR',
          },
        },
      },
    });

    return workspace;
  }

  async get(input: WorkspaceByIdInput) {
    const workspace = await database.client.workspace.findUnique({
      where: { id: input.workspaceId },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundError(input.workspaceId);
    }

    return workspace;
  }

  async update(input: UpdateWorkspaceInput) {
    const workspace = await database.client.workspace.findUnique({
      where: { id: input.workspaceId },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundError(input.workspaceId);
    }

    const updatedWorkspace = await database.client.workspace.update({
      where: { id: input.workspaceId },
      data: {
        name: input.name,
      },
    });

    return updatedWorkspace;
  }

  async delete(input: WorkspaceByIdInput) {
    const workspace = await database.client.workspace.findUnique({
      where: { id: input.workspaceId },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundError(input.workspaceId);
    }

    await database.client.workspace.deleteMany({
      where: { id: input.workspaceId },
    });
  }
}

export default WorkspaceService;
