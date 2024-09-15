import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceMemberPath } from '../members/router';
import { WorkspaceMemberCreationResponseStatus } from '../members/types';
import { WorkspaceCreationMemberInput } from '../members/validators';
import { WorkspacePath } from '../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceUpdateForbiddenResponseBody,
  WorkspaceUpdateUnauthorizedResponseBody,
  WorkspaceDeletionResponseStatus,
} from '../types';
import { WorkspaceCreationInput } from '../validators';
import WorkspaceService from '../WorkspaceService';

describe('Workspaces: Delete', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes a workspace', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(204 satisfies WorkspaceDeletionResponseStatus);

    const workspaceInDatabase = await database.client.workspace.findUnique({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase).toBeNull();
  });

  it("deletes the user's default workspace", async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(204 satisfies WorkspaceDeletionResponseStatus);

    const workspaceInDatabase = await database.client.workspace.findUnique({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase).toBeNull();
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceDeletionResponse = await supertest(app)
      .delete('/workspaces/unknown' satisfies WorkspacePath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(403 satisfies WorkspaceDeletionResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<WorkspaceUpdateForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not an administrator of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    let workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });

    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(403 satisfies WorkspaceDeletionResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<WorkspaceUpdateForbiddenResponseBody>({
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

  it('returns an error if not authenticated', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app).delete(
      `/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral,
    );

    expect(workspaceDeletionResponse.status).toBe(401 satisfies WorkspaceDeletionResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<WorkspaceUpdateUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}` satisfies WorkspacePath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(401 satisfies WorkspaceDeletionResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<WorkspaceUpdateUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
