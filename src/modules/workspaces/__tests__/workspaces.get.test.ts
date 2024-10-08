import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceGetByIdForbiddenResponseBody,
  WorkspaceGetByIdResponseStatus,
  WorkspaceGetByIdSuccessResponseBody,
  WorkspaceGetByIdUnauthorizedResponseBody,
} from '../types';
import { WorkspaceCreationInput } from '../validators';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspaces: Get', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets a workspace by id', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const getWorkspaceResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getWorkspaceResponse.status).toBe(200 satisfies WorkspaceGetByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<WorkspaceGetByIdSuccessResponseBody>({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const getWorkspaceResponse = await supertest(app)
      .get('/workspaces/invalid' satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getWorkspaceResponse.status).toBe(403 satisfies WorkspaceGetByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/invalid'.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { cookies: otherCookies } = await createAuthenticatedUser(app);

    const getWorkspaceResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(getWorkspaceResponse.status).toBe(403 satisfies WorkspaceGetByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const getWorkspaceResponse = await supertest(app).get('/workspaces/unknown' satisfies WorkspacePath.NonLiteral);

    expect(getWorkspaceResponse.status).toBe(401 satisfies WorkspaceGetByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<WorkspaceGetByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const getWorkspaceResponse = await supertest(app)
      .get('/workspaces/unknown' satisfies WorkspacePath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(getWorkspaceResponse.status).toBe(401 satisfies WorkspaceGetByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<WorkspaceGetByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
