import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import { CreateWorkspaceResponseStatus, CreateWorkspaceSuccessResponseBody } from '../../types';
import { CreateWorkspaceInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  CreateWorkspaceMemberResponseStatus,
  DeleteWorkspaceMemberResponseStatus,
  DeleteWorkspaceMemberNotFoundResponseBody,
  DeleteWorkspaceMemberForbiddenResponseBody,
  CreateWorkspaceMemberSuccessResponseBody,
} from '../types';
import { CreateWorkspaceMemberInput } from '../validators';

describe.only('Workspace members: Delete', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes a workspace member', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: CreateWorkspaceMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(204 satisfies DeleteWorkspaceMemberResponseStatus);

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(1);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
  });

  it('returns an error if the workspace member does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(404 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `Workspace member 'unknown' not found.`,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/unknown/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(403 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberForbiddenResponseBody>({
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

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberInput: CreateWorkspaceMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(403 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberForbiddenResponseBody>({
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

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(403 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberForbiddenResponseBody>({
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

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: CreateWorkspaceMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app).delete(
      `/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(workspaceDeletionResponse.status).toBe(401 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberForbiddenResponseBody>({
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

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: CreateWorkspaceMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const member = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const workspaceDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(workspaceDeletionResponse.status).toBe(401 satisfies DeleteWorkspaceMemberResponseStatus);
    expect(workspaceDeletionResponse.body).toEqual<DeleteWorkspaceMemberForbiddenResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
