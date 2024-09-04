import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { WorkspaceMemberLastMemberError, WorkspaceMemberNotFoundError } from './errors';
import {
  CreateWorkspaceMemberInput,
  WorkspaceMemberByIdInput,
  UpdateWorkspaceMemberInput,
  ListWorkspaceMembersInput,
} from './validators';
import { Prisma, User, Workspace, WorkspaceMember, WorkspaceMemberType } from '@prisma/client';

const WORKSPACE_MEMBER_TYPE_PRIORITY: Record<WorkspaceMemberType, number> = {
  ADMINISTRATOR: 1,
  DEFAULT: 0,
};

class WorkspaceMemberService {
  private static _instance = new WorkspaceMemberService();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  async create(creatorId: User['id'], input: CreateWorkspaceMemberInput) {
    const member = await database.client.workspaceMember.create({
      data: {
        id: createId(),
        workspaceId: input.workspaceId,
        userId: input.userId,
        type: input.type,
        creatorId,
      },
      include: { user: true },
    });

    return member;
  }

  async list(input: ListWorkspaceMembersInput) {
    const where: Prisma.WorkspaceMemberWhereInput = {
      workspaceId: input.workspaceId,
      type: input.type,
      user: input.name
        ? {
            name: { contains: input.name, mode: 'insensitive' },
          }
        : undefined,
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

  hasTypeAtLeast(member: WorkspaceMember, minimumType: WorkspaceMemberType) {
    return this.getTypesAtLeast(minimumType).includes(member.type);
  }

  private getTypesAtLeast(minimumType: WorkspaceMemberType): WorkspaceMemberType[] {
    const miniumPriority = WORKSPACE_MEMBER_TYPE_PRIORITY[minimumType];

    return Object.entries(WORKSPACE_MEMBER_TYPE_PRIORITY)
      .filter(([_type, priority]) => priority >= miniumPriority)
      .map(([type]) => type);
  }
}

export default WorkspaceMemberService;
