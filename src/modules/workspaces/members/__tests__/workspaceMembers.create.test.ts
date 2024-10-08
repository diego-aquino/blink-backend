import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceCreationUnauthorizedResponseBody,
} from '../../types';
import { WorkspaceCreationInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  WorkspaceMemberCreationBadRequestResponseBody,
  WorkspaceMemberCreationForbiddenResponseBody,
  WorkspaceMemberCreationResponseStatus,
  WorkspaceMemberCreationSuccessResponseBody,
} from '../types';
import { WorkspaceCreationMemberInput } from '../validators';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspace members: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a workspace member with administrator type', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    expect(member).toEqual<WorkspaceMemberCreationSuccessResponseBody>({
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
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    expect(member).toEqual<WorkspaceMemberCreationSuccessResponseBody>({
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
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    // @ts-expect-error
    const memberInput: WorkspaceCreationMemberInput.Body = { userId: 1, type: 'DEFAULT' };

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberCreationResponse.status).toBe(400 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceMemberCreationBadRequestResponseBody>({
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
    const { user, cookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post('/workspaces/unknown/members' satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: user.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(403 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not an administrator of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    let memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const { user: anotherUser } = await createAuthenticatedUser(app);

    memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send({ userId: anotherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(403 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
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
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { cookies: otherCookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send({ userId: user.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(403 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
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
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const memberCreationResponse = await supertest(app).post(
      `/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(memberCreationResponse.status).toBe(401 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(memberCreationResponse.status).toBe(401 satisfies WorkspaceMemberCreationResponseStatus);
    expect(memberCreationResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
