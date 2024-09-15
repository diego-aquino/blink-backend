import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationUnauthorizedResponseBody,
  WorkspaceGetByIdForbiddenResponseBody,
} from '../../types';
import { WorkspaceCreationInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  WorkspaceMemberCreationResponseStatus,
  WorkspaceMemberCreationSuccessResponseBody,
  WorkspaceMemberGetByIdNotFoundResponseBody,
  WorkspaceMemberGetByIdResponseStatus,
  WorkspaceMemberGetByIdSuccessResponseBody,
} from '../types';
import { WorkspaceCreationMemberInput } from '../validators';
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

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const getMemberResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(getMemberResponse.status).toBe(200 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceMemberGetByIdSuccessResponseBody>(member);
  });

  it('returns an error if the workspace member does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const getMemberResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(getMemberResponse.status).toBe(404 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceMemberGetByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: "Workspace member 'unknown' not found.",
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const getMemberResponse = await supertest(app)
      .get('/workspaces/unknown/members/unknown' satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(getMemberResponse.status).toBe(403 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/unknown'.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: defaultWorkspace.id, userId: user.id } },
    });

    const getMemberResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(getMemberResponse.status).toBe(403 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const getMemberResponse = await supertest(app).get(
      `/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(getMemberResponse.status).toBe(401 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
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

    const workspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const getMemberResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(getMemberResponse.status).toBe(401 satisfies WorkspaceMemberGetByIdResponseStatus);
    expect(getMemberResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
