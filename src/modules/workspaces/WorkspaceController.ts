import WorkspaceService from './WorkspaceService';
import { RequestHandler } from '../shared/controllers';
import { toWorkspaceResponse } from './views';
import {
  workspaceCreationSchema,
  workspaceByIdSchema,
  workspaceUpdateSchema,
  workspacesListSchema,
} from './validators';
import {
  WorkspaceCreationRequestBody,
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceDeletionResponseStatus,
  WorkspaceGetByIdResponseStatus,
  WorkspaceGetByIdSuccessResponseBody,
  WorkspaceListParams,
  WorkspaceListResponseStatus,
  WorkspaceListSuccessResponseBody,
  WorkspaceUpdateRequestBody,
  WorkspaceUpdateResponseStatus,
  WorkspaceUpdateSuccessResponseBody,
  WorkspaceByIdPathParams,
} from './types';

class WorkspaceController {
  private static _instance = new WorkspaceController();

  static instance() {
    return this._instance;
  }

  private workspaceService = WorkspaceService.instance();

  private constructor() {}

  create: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.auth.authenticated;
    const input = workspaceCreationSchema.parse(request.body) satisfies WorkspaceCreationRequestBody;

    const workspace = await this.workspaceService.create(userId, input);

    return response
      .status(201 satisfies WorkspaceCreationResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies WorkspaceCreationSuccessResponseBody);
  };

  listAsMember: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.auth.authenticated;
    const input = workspacesListSchema.parse({
      ...request.params,
      ...request.query,
    }) satisfies WorkspaceListParams;

    const workspaces = await this.workspaceService.listByMember(userId, input);

    return response.status(200 satisfies WorkspaceListResponseStatus).json({
      workspaces: workspaces.list.map(toWorkspaceResponse),
      total: workspaces.total,
    } satisfies WorkspaceListSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceByIdSchema.parse(request.params) satisfies WorkspaceByIdPathParams;
    const workspace = await this.workspaceService.get(input);

    return response
      .status(200 satisfies WorkspaceGetByIdResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies WorkspaceGetByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = workspaceUpdateSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceByIdPathParams & WorkspaceUpdateRequestBody;

    const workspace = await this.workspaceService.update(input);

    return response
      .status(200 satisfies WorkspaceUpdateResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies WorkspaceUpdateSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceByIdSchema.parse(request.params) satisfies WorkspaceByIdPathParams;
    await this.workspaceService.delete(input);

    return response.status(204 satisfies WorkspaceDeletionResponseStatus).send();
  };
}

export default WorkspaceController;
