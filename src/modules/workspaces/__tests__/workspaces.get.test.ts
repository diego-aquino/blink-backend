import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  GetWorkspaceByIdForbiddenResponseBody,
  GetWorkspaceByIdResponseStatus,
  GetWorkspaceByIdSuccessResponseBody,
  GetWorkspaceByIdUnauthorizedResponseBody,
} from '../types';
import { CreateWorkspaceInput } from '../validators';

describe('Workspaces: Get', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets a workspace by id', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const getWorkspaceResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(getWorkspaceResponse.status).toBe(200 satisfies GetWorkspaceByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<GetWorkspaceByIdSuccessResponseBody>({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const getWorkspaceResponse = await supertest(app)
      .get('/workspaces/invalid' satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(getWorkspaceResponse.status).toBe(403 satisfies GetWorkspaceByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/invalid'.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const getWorkspaceResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(getWorkspaceResponse.status).toBe(403 satisfies GetWorkspaceByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const getWorkspaceResponse = await supertest(app).get('/workspaces/unknown' satisfies WorkspacePath.NonLiteral);

    expect(getWorkspaceResponse.status).toBe(401 satisfies GetWorkspaceByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<GetWorkspaceByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const getWorkspaceResponse = await supertest(app)
      .get('/workspaces/unknown' satisfies WorkspacePath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(getWorkspaceResponse.status).toBe(401 satisfies GetWorkspaceByIdResponseStatus);
    expect(getWorkspaceResponse.body).toEqual<GetWorkspaceByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
