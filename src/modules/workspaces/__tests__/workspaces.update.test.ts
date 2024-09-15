import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  UpdateWorkspaceBadRequestResponseBody,
  UpdateWorkspaceForbiddenResponseBody,
  UpdateWorkspaceRequestBody,
  UpdateWorkspaceResponseStatus,
  UpdateWorkspaceSuccessResponseBody,
  UpdateWorkspaceUnauthorizedResponseBody,
} from '../types';
import { CreateWorkspaceInput } from '../validators';
import { WorkspaceMemberPath } from '../members/router';
import { CreateWorkspaceMemberInput } from '../members/validators';
import { CreateWorkspaceMemberResponseStatus } from '../members/types';

describe('Workspaces: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates a workspace as an administrator', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies UpdateWorkspaceRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateWorkspaceResponse.status).toBe(200 satisfies UpdateWorkspaceResponseStatus);

    const updatedWorkspace = updateWorkspaceResponse.body as UpdateWorkspaceSuccessResponseBody;

    expect(updatedWorkspace).toEqual<UpdateWorkspaceSuccessResponseBody>({
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
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateInput = input satisfies UpdateWorkspaceRequestBody;

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateWorkspaceResponse.status).toBe(200 satisfies UpdateWorkspaceResponseStatus);

    const updatedWorkspace = updateWorkspaceResponse.body as UpdateWorkspaceSuccessResponseBody;

    expect(updatedWorkspace).toEqual<UpdateWorkspaceSuccessResponseBody>({
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
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(
        // @ts-expect-error
        { name: 1 } satisfies UpdateWorkspaceRequestBody,
      );

    expect(updateWorkspaceResponse.status).toBe(400 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceBadRequestResponseBody>({
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
    const { auth } = await createAuthenticatedUser(app);

    const updateWorkspaceResponse = await supertest(app)
      .patch('/workspaces/unknown' satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        name: 'Workspace (updated)',
      } satisfies UpdateWorkspaceRequestBody);

    expect(updateWorkspaceResponse.status).toBe(403 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not an administrator of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies UpdateWorkspaceRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies CreateWorkspaceMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    let workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });

    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateWorkspaceResponse.status).toBe(403 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceForbiddenResponseBody>({
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
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateInput = {
      name: 'Workspace (updated)',
    } satisfies UpdateWorkspaceRequestBody;

    expect(updateInput.name).not.toBe(workspace.name);

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateWorkspaceResponse.status).toBe(403 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceForbiddenResponseBody>({
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
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateWorkspaceResponse = await supertest(app).patch(
      `/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral,
    );

    expect(updateWorkspaceResponse.status).toBe(401 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateWorkspaceResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(updateWorkspaceResponse.status).toBe(401 satisfies UpdateWorkspaceResponseStatus);
    expect(updateWorkspaceResponse.body).toEqual<UpdateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
