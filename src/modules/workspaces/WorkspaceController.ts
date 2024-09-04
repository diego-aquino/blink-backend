import WorkspaceService from './WorkspaceService';
import { RequestHandler } from '../shared/controllers';
import { toWorkspaceResponse } from './views';
import { createWorkspaceSchema, workspaceByIdSchema, updateWorkspaceSchema, listWorkspacesSchema } from './validators';
import {
  CreateWorkspaceRequestBody,
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  DeleteWorkspaceResponseStatus,
  GetWorkspaceByIdResponseStatus,
  GetWorkspaceByIdSuccessResponseBody,
  ListWorkspacesParams,
  ListWorkspacesResponseStatus,
  ListWorkspacesSuccessResponseBody,
  UpdateWorkspaceRequestBody,
  UpdateWorkspaceResponseStatus,
  UpdateWorkspaceSuccessResponseBody,
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
    const input = createWorkspaceSchema.parse(request.body) satisfies CreateWorkspaceRequestBody;

    const workspace = await this.workspaceService.create(userId, input);

    return response
      .status(201 satisfies CreateWorkspaceResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies CreateWorkspaceSuccessResponseBody);
  };

  listAsMember: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.auth.authenticated;
    const input = listWorkspacesSchema.parse({
      ...request.params,
      ...request.query,
    }) satisfies ListWorkspacesParams;

    const workspaces = await this.workspaceService.listByMember(userId, input);

    return response.status(200 satisfies ListWorkspacesResponseStatus).json({
      workspaces: workspaces.list.map(toWorkspaceResponse),
      total: workspaces.total,
    } satisfies ListWorkspacesSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = workspaceByIdSchema.parse(request.params) satisfies WorkspaceByIdPathParams;
    const workspace = await this.workspaceService.get(input);

    return response
      .status(200 satisfies GetWorkspaceByIdResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies GetWorkspaceByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateWorkspaceSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies WorkspaceByIdPathParams & UpdateWorkspaceRequestBody;

    const workspace = await this.workspaceService.update(input);

    return response
      .status(200 satisfies UpdateWorkspaceResponseStatus)
      .json(toWorkspaceResponse(workspace) satisfies UpdateWorkspaceSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = workspaceByIdSchema.parse(request.params) satisfies WorkspaceByIdPathParams;
    await this.workspaceService.delete(input);

    return response.status(204 satisfies DeleteWorkspaceResponseStatus).send();
  };
}

export default WorkspaceController;
