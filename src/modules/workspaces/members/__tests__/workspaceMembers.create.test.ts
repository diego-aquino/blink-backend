import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import {
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  CreateWorkspaceUnauthorizedResponseBody,
} from '../../types';
import { CreateWorkspaceInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  CreateWorkspaceMemberBadRequestResponseBody,
  CreateWorkspaceMemberForbiddenResponseBody,
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberSuccessResponseBody,
  WorkspaceMemberResponse,
} from '../types';
import { CreateWorkspaceMemberInput } from '../validators';

describe('Workspace members: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a workspace member with administrator type', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies CreateWorkspaceMemberInput.Body);

    expect(response.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = response.body as CreateWorkspaceMemberSuccessResponseBody;

    expect(member).toEqual<CreateWorkspaceMemberSuccessResponseBody>({
      id: expect.any(String),
      user: otherUser,
      type: 'ADMINISTRATOR',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
  });

  it('creates a workspace member with default type', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies CreateWorkspaceMemberInput.Body);

    expect(response.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = response.body as CreateWorkspaceMemberSuccessResponseBody;

    expect(member).toEqual<CreateWorkspaceMemberSuccessResponseBody>({
      id: expect.any(String),
      user: otherUser,
      type: 'DEFAULT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
  });

  it('returns an error if trying to create a workspace member with invalid inputs', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    // @ts-expect-error
    const memberInput: CreateWorkspaceMemberInput.Body = { userId: 1, type: 'DEFAULT' };

    const response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(response.status).toBe(400 satisfies CreateWorkspaceMemberResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceMemberBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['userId'],
          message: 'Expected string, received number',
        },
      ],
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const memberInput: CreateWorkspaceMemberInput.Body = { userId: '1', type: 'DEFAULT' };

    const response = await supertest(app)
      .post('/workspaces/unknown/members' satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(response.status).toBe(403 satisfies CreateWorkspaceMemberResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not an administrator of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const creationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(creationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    let response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies CreateWorkspaceMemberInput.Body);

    expect(response.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const { user: anotherUser, auth: anotherAuth } = await createAuthenticatedUser(app);

    response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send({ userId: anotherUser.id, type: 'DEFAULT' } satisfies CreateWorkspaceMemberInput.Body);

    expect(response.status).toBe(403 satisfies CreateWorkspaceMemberResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
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

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send({ userId: user.id, type: 'DEFAULT' } satisfies CreateWorkspaceMemberInput.Body);

    expect(response.status).toBe(403 satisfies CreateWorkspaceMemberResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.members).toHaveLength(1);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
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

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const response = await supertest(app).post(
      `/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(response.status).toBe(401 satisfies CreateWorkspaceMemberResponseStatus);
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

    const workspace = creationResponse.body as CreateWorkspaceSuccessResponseBody;

    const response = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies CreateWorkspaceMemberResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
