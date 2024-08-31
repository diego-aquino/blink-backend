import { RequestHandler } from '@/modules/shared/controllers';

import WorkspaceMemberService from './WorkspaceMemberService';
import { toWorkspaceMemberResponse } from './views';
import { createWorkspaceMemberSchema, workspaceMemberByIdSchema, updateWorkspaceMemberSchema } from './validators';
import {
  CreateWorkspaceMemberRequestBody,
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberSuccessResponseBody,
  DeleteWorkspaceMemberResponseStatus,
  GetWorkspaceMemberByIdResponseStatus,
  GetWorkspaceMemberByIdSuccessResponseBody,
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

    const workspaceMember = await this.workspaceMemberService.create(userId, input);

    return response
      .status(201 satisfies CreateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(workspaceMember) satisfies CreateWorkspaceMemberSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    const workspaceMember = await this.workspaceMemberService.get(input);

    return response
      .status(200 satisfies GetWorkspaceMemberByIdResponseStatus)
      .json(toWorkspaceMemberResponse(workspaceMember) satisfies GetWorkspaceMemberByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateWorkspaceMemberSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceMemberByIdPathParams & UpdateWorkspaceMemberRequestBody;

    const workspaceMember = await this.workspaceMemberService.update(input);

    return response
      .status(200 satisfies UpdateWorkspaceMemberResponseStatus)
      .json(toWorkspaceMemberResponse(workspaceMember) satisfies UpdateWorkspaceMemberSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    await this.workspaceMemberService.delete(input);

    return response.status(204 satisfies DeleteWorkspaceMemberResponseStatus).send();
  };
}

export default WorkspaceMemberController;
