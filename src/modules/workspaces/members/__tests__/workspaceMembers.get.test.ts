import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import { CreateWorkspaceResponseStatus, CreateWorkspaceUnauthorizedResponseBody } from '../../types';
import { CreateWorkspaceInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberSuccessResponseBody,
  GetWorkspaceMemberByIdNotFoundResponseBody,
  GetWorkspaceMemberByIdResponseStatus,
  GetWorkspaceMemberByIdSuccessResponseBody,
} from '../types';
import { CreateWorkspaceMemberInput } from '../validators';
import WorkspaceService from '../../WorkspaceService';
import database from '@/database/client';

describe('Workspace members: Get', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets a workspace member by id', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies CreateWorkspaceMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<GetWorkspaceMemberByIdSuccessResponseBody>(member);
  });

  it('returns an error if the workspace member does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(404 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<GetWorkspaceMemberByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: "Workspace member 'unknown' not found.",
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .get('/workspaces/unknown/members/unknown' satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(404 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<GetWorkspaceMemberByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: 'Resource not found.',
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: defaultWorkspace.id, userId: user.id } },
    });

    const response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(404 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<GetWorkspaceMemberByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: 'Resource not found.',
    });
  });

  it('returns an error if not authenticated', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const response = await supertest(app).get(
      `/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(response.status).toBe(401 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies GetWorkspaceMemberByIdResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
