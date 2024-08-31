import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { WorkspaceMemberLastMemberError, WorkspaceMemberNotFoundError } from './errors';
import {
  CreateWorkspaceMemberInput,
  WorkspaceMemberByIdInput,
  UpdateWorkspaceMemberInput,
  ListWorkspaceMembersInput,
} from './validators';
import { Prisma, Workspace } from '@prisma/client';

class WorkspaceMemberService {
  private static _instance = new WorkspaceMemberService();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  async create(workspaceId: Workspace['id'], input: CreateWorkspaceMemberInput) {
    const member = await database.client.workspaceMember.create({
      data: {
        id: createId(),
        workspaceId,
        userId: input.userId,
        type: input.type,
      },
      include: { user: true },
    });

    return member;
  }

  async list(input: ListWorkspaceMembersInput) {
    const where: Prisma.WorkspaceMemberWhereInput = {
      workspaceId: input.workspaceId,
      type: input.type,
      user: {
        name: { contains: input.name, mode: 'insensitive' },
      },
    };

    const [members, total] = await Promise.all([
      database.client.workspaceMember.findMany({
        where,
        include: { user: true },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      database.client.workspaceMember.count({ where }),
    ]);

    return { list: members, total };
  }

  async get(input: WorkspaceMemberByIdInput) {
    const member = await database.client.workspaceMember.findUnique({
      where: {
        id: input.memberId,
        workspaceId: input.workspaceId,
      },
      include: { user: true },
    });

    if (!member) {
      throw new WorkspaceMemberNotFoundError(input.memberId);
    }

    return member;
  }

  async update(input: UpdateWorkspaceMemberInput) {
    const member = await database.client.workspaceMember.findUnique({
      where: {
        id: input.memberId,
        workspaceId: input.workspaceId,
      },
    });

    if (!member) {
      throw new WorkspaceMemberNotFoundError(input.memberId);
    }

    const updatedMember = await database.client.workspaceMember.update({
      where: { id: input.memberId },
      data: {
        type: input.type,
      },
      include: { user: true },
    });

    return updatedMember;
  }

  async delete(input: WorkspaceMemberByIdInput) {
    const member = await database.client.workspaceMember.findUnique({
      where: { id: input.memberId },
      include: {
        workspace: { include: { members: true } },
      },
    });

    if (!member) {
      throw new WorkspaceMemberNotFoundError(input.memberId);
    }

    if (member.workspace.members.length === 1) {
      throw new WorkspaceMemberLastMemberError(input.memberId);
    }

    await database.client.workspaceMember.deleteMany({
      where: { id: input.memberId },
    });
  }
}

export default WorkspaceMemberService;
