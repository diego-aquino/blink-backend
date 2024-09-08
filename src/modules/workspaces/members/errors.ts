import { BadRequestError, NotFoundError } from '@/errors/http';
import { WorkspaceMember } from '@prisma/client';

export class WorkspaceMemberNotFoundError extends NotFoundError {
  constructor(memberId: WorkspaceMember['id']) {
    super(`Workspace member '${memberId}' not found.`);
  }
}

export class WorkspaceMemberLastAdministratorError extends BadRequestError {
  constructor(memberId: WorkspaceMember['id']) {
    super(`Workspace member '${memberId}' is the last administrator of the workspace.`);
  }
}

export class WorkspaceMemberLastMemberError extends BadRequestError {
  constructor(memberId: WorkspaceMember['id']) {
    super(`Workspace member '${memberId}' is the last member of the workspace.`);
  }
}
