import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  ListWorkspacesResponseStatus,
  ListWorkspacesSuccessResponseBody,
  ListWorkspacesUnauthorizedResponseBody,
} from '../types';
import { CreateWorkspaceInput, ListWorkspacesInput } from '../validators';
import WorkspaceService from '../WorkspaceService';
import { toWorkspaceResponse } from '../views';

describe('Workspaces: List', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('lists workspaces as a member with pagination', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    let creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const otherWorkspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    let response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    let { workspaces, total } = response.body as ListWorkspacesSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(3);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<CreateWorkspaceSuccessResponseBody>(workspace);
    expect(workspaces[2]).toEqual<CreateWorkspaceSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);

    response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 1, limit: 2 } satisfies ListWorkspacesInput);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ workspaces, total } = response.body as ListWorkspacesSuccessResponseBody);

    expect(workspaces).toHaveLength(2);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<CreateWorkspaceSuccessResponseBody>(workspace);

    expect(total).toBe(3);

    response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 2, limit: 2 } satisfies ListWorkspacesInput);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ workspaces, total } = response.body as ListWorkspacesSuccessResponseBody);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);
  });

  it('filters workspaces as a member by case-insensitive name', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    let creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Other Workspace' } satisfies CreateWorkspaceInput);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const otherWorkspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    let response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: 'workspace' } satisfies ListWorkspacesInput.Raw);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    let { workspaces, total } = response.body as ListWorkspacesSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(3);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<CreateWorkspaceSuccessResponseBody>(workspace);
    expect(workspaces[2]).toEqual<CreateWorkspaceSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);

    response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: 'other' } satisfies ListWorkspacesInput.Raw);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ workspaces, total } = response.body as ListWorkspacesSuccessResponseBody);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(otherWorkspace);

    expect(total).toBe(1);
  });

  it('does not list workspaces as not a member', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    let response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    let { workspaces, total } = response.body as ListWorkspacesSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(2);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(workspace);
    expect(workspaces[1]).toEqual<CreateWorkspaceSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(2);

    response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ workspaces, total } = response.body as ListWorkspacesSuccessResponseBody);

    const otherDefaultWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherDefaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<CreateWorkspaceSuccessResponseBody>(toWorkspaceResponse(otherDefaultWorkspace));

    expect(total).toBe(1);
  });

  it('returns an error if not authenticated', async () => {
    const response = await supertest(app).get('/workspaces' satisfies WorkspacePath);

    expect(response.status).toBe(401 satisfies ListWorkspacesResponseStatus);
    expect(response.body).toEqual<ListWorkspacesUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const response = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies ListWorkspacesResponseStatus);
    expect(response.body).toEqual<ListWorkspacesUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
