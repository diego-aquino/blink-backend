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
  ListWorkspaceMembersParamsSuccessResponseBody,
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

  private constructor() {}

  private workspaceMemberService = WorkspaceMemberService.instance();

  create: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.authenticated;
    const input = createWorkspaceMemberSchema.parse(request.body) satisfies CreateWorkspaceMemberRequestBody;

    const member = await this.workspaceMemberService.create(userId, input);

    return response
      .status(201 satisfies CreateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies CreateWorkspaceMemberSuccessResponseBody);
  };

  list: RequestHandler = async (request, response) => {
    const input = listWorkspaceMembersSchema.parse({
      ...request.params,
      ...request.query,
    }) satisfies ListWorkspaceMembersParamsSuccessResponseBody;

    const members = await this.workspaceMemberService.list(input);

    return response.status(200 satisfies ListWorkspaceMembersResponseStatus).json({
      members: members.list.map(toWorkspaceMemberResponse),
      total: members.total,
    } satisfies ListWorkspaceMembersSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    const member = await this.workspaceMemberService.get(input);

    return response
      .status(200 satisfies GetWorkspaceMemberByIdResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies GetWorkspaceMemberByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateWorkspaceMemberSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceMemberByIdPathParams & UpdateWorkspaceMemberRequestBody;

    const member = await this.workspaceMemberService.update(input);

    return response
      .status(200 satisfies UpdateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies UpdateWorkspaceMemberSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    await this.workspaceMemberService.delete(input);

    return response.status(204 satisfies DeleteWorkspaceMemberResponseStatus).send();
  };
}

export default WorkspaceMemberController;
