import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { WorkspaceNotFoundError } from './errors';
import { CreateWorkspaceInput, WorkspaceByIdInput, UpdateWorkspaceInput, ListWorkspacesInput } from './validators';
import { Prisma, User, WorkspaceMemberType } from '@prisma/client';
import { TransactionOptions } from '@/types/database';

class WorkspaceService {
  private static _instance = new WorkspaceService();

  static instance() {
    return this._instance;
  }

  private readonly DEFAULT_WORKSPACE_CREATOR_MEMBER_TYPE: WorkspaceMemberType = 'ADMINISTRATOR';

  private constructor() {}

  async create(
    creatorId: User['id'],
    input: CreateWorkspaceInput,
    { transaction = database.client }: TransactionOptions = {},
  ) {
    const workspace = await transaction.workspace.create({
      data: {
        id: createId(),
        name: input.name,
        creatorId,
        members: {
          create: {
            id: createId(),
            userId: creatorId,
            type: this.DEFAULT_WORKSPACE_CREATOR_MEMBER_TYPE,
          },
        },
      },
    });

    return workspace;
  }

  async listByMember(memberId: User['id'], input: ListWorkspacesInput) {
    const where: Prisma.WorkspaceWhereInput = {
      name: input.name ? { contains: input.name, mode: 'insensitive' } : undefined,
      members: {
        some: { userId: memberId },
      },
    };

    const [list, total] = await Promise.all([
      database.client.workspace.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      database.client.workspace.count({ where }),
    ]);

    return { list, total };
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
