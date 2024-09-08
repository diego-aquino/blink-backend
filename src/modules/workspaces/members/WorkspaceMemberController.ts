import { RequestHandler } from '@/modules/shared/controllers';

import WorkspaceMemberService from './WorkspaceMemberService';
import { toWorkspaceMemberResponse } from './views';
import {
  createWorkspaceMemberSchema,
  workspaceMemberByIdSchema,
  updateWorkspaceMemberSchema,
  listWorkspaceMembersSchema,
} from './validators';
import {
  CreateWorkspaceMemberRequestBody,
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberSuccessResponseBody,
  DeleteWorkspaceMemberResponseStatus,
  GetWorkspaceMemberByIdResponseStatus,
  GetWorkspaceMemberByIdSuccessResponseBody,
  ListWorkspaceMembersParams,
  ListWorkspaceMembersResponseStatus,
  ListWorkspaceMembersSuccessResponseBody,
  UpdateWorkspaceMemberRequestBody,
  UpdateWorkspaceMemberResponseStatus,
  UpdateWorkspaceMemberSuccessResponseBody,
  WorkspaceMemberByIdPathParams,
} from './types';

class WorkspaceMemberController {
  private static _instance = new WorkspaceMemberController();

  static instance() {
    return this._instance;
  }

  private memberService = WorkspaceMemberService.instance();

  private constructor() {}

  create: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.auth.authenticated;

    const input = createWorkspaceMemberSchema.parse({
      ...request.params,
      ...request.body,
    }) satisfies CreateWorkspaceMemberRequestBody;

    const member = await this.memberService.create(userId, input);

    return response
      .status(201 satisfies CreateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies CreateWorkspaceMemberSuccessResponseBody);
  };

  list: RequestHandler = async (request, response) => {
    const input = listWorkspaceMembersSchema.parse({
      ...request.params,
      ...request.query,
    }) satisfies ListWorkspaceMembersParams;

    const members = await this.memberService.list(input);

    return response.status(200 satisfies ListWorkspaceMembersResponseStatus).json({
      members: members.list.map(toWorkspaceMemberResponse),
      total: members.total,
    } satisfies ListWorkspaceMembersSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    const member = await this.memberService.get(input);

    return response
      .status(200 satisfies GetWorkspaceMemberByIdResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies GetWorkspaceMemberByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateWorkspaceMemberSchema.parse({
      ...request.params,
      ...request.body,
    }) satisfies WorkspaceMemberByIdPathParams & UpdateWorkspaceMemberRequestBody;

    const member = await this.memberService.update(input);

    return response
      .status(200 satisfies UpdateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies UpdateWorkspaceMemberSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    await this.memberService.delete(input);

    return response.status(204 satisfies DeleteWorkspaceMemberResponseStatus).send();
  };
}

export default WorkspaceMemberController;
