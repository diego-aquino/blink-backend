import { RequestHandler } from '@/modules/shared/controllers';

import WorkspaceMemberService from './WorkspaceMemberService';
import { toWorkspaceMemberResponse } from './views';
import {
  workspaceMemberCreationSchema,
  workspaceMemberByIdSchema,
  workspaceMemberUpdateSchema,
  workspaceMembersListSchema,
} from './validators';
import {
  WorkspaceMemberCreationRequestBody,
  WorkspaceMemberCreationResponseStatus,
  WorkspaceMemberCreationSuccessResponseBody,
  WorkspaceMemberDeletionResponseStatus,
  WorkspaceMemberGetByIdResponseStatus,
  WorkspaceMemberGetByIdSuccessResponseBody,
  WorkspaceMemberListParams,
  WorkspaceMemberListResponseStatus,
  WorkspaceMemberListSuccessResponseBody,
  WorkspaceMemberUpdateRequestBody,
  WorkspaceMemberUpdateResponseStatus,
  WorkspaceMemberUpdateSuccessResponseBody,
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

    const input = workspaceMemberCreationSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceMemberCreationRequestBody;

    const member = await this.memberService.create(userId, input);

    return response
      .status(201 satisfies WorkspaceMemberCreationResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies WorkspaceMemberCreationSuccessResponseBody);
  };

  list: RequestHandler = async (request, response) => {
    const input = workspaceMembersListSchema.parse({
      ...request.query,
      ...request.params,
    }) satisfies WorkspaceMemberListParams;

    const members = await this.memberService.list(input);

    return response.status(200 satisfies WorkspaceMemberListResponseStatus).json({
      members: members.list.map(toWorkspaceMemberResponse),
      total: members.total,
    } satisfies WorkspaceMemberListSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    const member = await this.memberService.get(input);

    return response
      .status(200 satisfies WorkspaceMemberGetByIdResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies WorkspaceMemberGetByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = workspaceMemberUpdateSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceMemberByIdPathParams & WorkspaceMemberUpdateRequestBody;

    const member = await this.memberService.update(input);

    return response
      .status(200 satisfies WorkspaceMemberUpdateResponseStatus)
      .json(toWorkspaceMemberResponse(member) satisfies WorkspaceMemberUpdateSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceMemberByIdSchema.parse(request.params) satisfies WorkspaceMemberByIdPathParams;
    await this.memberService.delete(input);

    return response.status(204 satisfies WorkspaceMemberDeletionResponseStatus).send();
  };
}

export default WorkspaceMemberController;
