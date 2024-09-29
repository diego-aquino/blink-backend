import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceUpdateBadRequestResponseBody,
  WorkspaceUpdateForbiddenResponseBody,
  WorkspaceUpdateRequestBody,
  WorkspaceUpdateResponseStatus,
  WorkspaceUpdateSuccessResponseBody,
  WorkspaceUpdateUnauthorizedResponseBody,
} from '../types';
import { WorkspaceCreationInput } from '../validators';
import { WorkspaceMemberPath } from '../members/router';
import { WorkspaceCreationMemberInput } from '../members/validators';
import { WorkspaceMemberCreationResponseStatus } from '../members/types';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspaces: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates a workspace as an administrator', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies WorkspaceUpdateRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(workspaceUpdateResponse.status).toBe(200 satisfies WorkspaceUpdateResponseStatus);

    const updatedWorkspace = workspaceUpdateResponse.body as WorkspaceUpdateSuccessResponseBody;

    expect(updatedWorkspace).toEqual<WorkspaceUpdateSuccessResponseBody>({
      ...workspace,
      name: updateInput.name,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedWorkspace.updatedAt).getTime()).toBeGreaterThan(new Date(workspace.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(updatedWorkspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(updatedWorkspace.updatedAt);
  });

  it('updates a workspace with unchanged inputs', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const input: WorkspaceCreationInput = {
      name: 'Workspace',
    };

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const updateInput = input satisfies WorkspaceUpdateRequestBody;

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(workspaceUpdateResponse.status).toBe(200 satisfies WorkspaceUpdateResponseStatus);

    const updatedWorkspace = workspaceUpdateResponse.body as WorkspaceUpdateSuccessResponseBody;

    expect(updatedWorkspace).toEqual<WorkspaceUpdateSuccessResponseBody>({
      ...workspace,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedWorkspace.updatedAt).getTime()).toBeGreaterThan(new Date(workspace.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(workspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(updatedWorkspace.updatedAt);
  });

  it('returns an error if trying to update a workspace with invalid inputs', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(
        // @ts-expect-error
        { name: 1 } satisfies WorkspaceUpdateRequestBody,
      );

    expect(workspaceUpdateResponse.status).toBe(400 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ],
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(workspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(workspace.updatedAt);
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceUpdateResponse = await supertest(app)
      .patch('/workspaces/unknown' satisfies WorkspacePath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Workspace (updated)',
      } satisfies WorkspaceUpdateRequestBody);

    expect(workspaceUpdateResponse.status).toBe(403 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateForbiddenResponseBody>({
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

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies WorkspaceUpdateRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    let workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });

    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(updateInput);

    expect(workspaceUpdateResponse.status).toBe(403 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: true },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(workspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(workspace.updatedAt);
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies WorkspaceUpdateRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const { cookies: otherCookies } = await createAuthenticatedUser(app);

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(updateInput);

    expect(workspaceUpdateResponse.status).toBe(403 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(workspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(workspace.updatedAt);
  });

  it('returns an error if not authenticated', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const workspaceUpdateResponse = await supertest(app).patch(
      `/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral,
    );

    expect(workspaceUpdateResponse.status).toBe(401 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateUnauthorizedResponseBody>({
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

    const workspaceUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(workspaceUpdateResponse.status).toBe(401 satisfies WorkspaceUpdateResponseStatus);
    expect(workspaceUpdateResponse.body).toEqual<WorkspaceUpdateUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
