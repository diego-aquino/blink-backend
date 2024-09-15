import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceGetByIdForbiddenResponseBody,
  WorkspaceListResponseStatus,
} from '../../types';
import { WorkspaceCreationInput, WorkspaceListInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  WorkspaceMemberCreationResponseStatus,
  WorkspaceMemberCreationSuccessResponseBody,
  WorkspaceMemberListResponseStatus,
  WorkspaceMemberListSuccessResponseBody,
} from '../types';
import { WorkspaceCreationMemberInput } from '../validators';
import WorkspaceService from '../../WorkspaceService';
import database from '@/database/client';
import { toWorkspaceMemberResponse } from '../views';
import { createId } from '@paralleldrive/cuid2';

describe('Workspace members: List', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('lists workspace members of a workspace with pagination', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      include: { user: true },
    });

    const { user: otherUser } = await createAuthenticatedUser(app);

    let memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const otherMember = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    let memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceMemberListResponseStatus);

    let { members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody;

    expect(members).toHaveLength(2);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(otherMember);
    expect(members[1]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(2);

    memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 1, limit: 1 } satisfies WorkspaceListInput);

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(otherMember);

    expect(total).toBe(2);

    memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 2, limit: 1 } satisfies WorkspaceListInput);

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(2);

    memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 3, limit: 1 } satisfies WorkspaceListInput);

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody);

    expect(members).toHaveLength(0);
    expect(total).toBe(2);
  });

  it('filters workspace members by case-insensitive name', async () => {
    const { user, auth } = await createAuthenticatedUser(app, {
      name: `User ${createId()}`,
    });

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      include: { user: true },
    });

    const { user: otherUser } = await createAuthenticatedUser(app, {
      name: `User ${createId()}`,
    });

    let memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const otherMember = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    let searchName = otherUser.name.slice(0, 10).toUpperCase();
    expect(searchName).not.toBe(user.name);
    expect(searchName).not.toBe(otherUser.name);

    let memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: searchName } satisfies WorkspaceListInput.Raw);

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceMemberListResponseStatus);

    let { members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody;

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(otherMember);

    expect(total).toBe(1);

    searchName = user.name;
    expect(searchName).not.toBe(otherUser.name);

    memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: searchName } satisfies WorkspaceListInput.Raw);

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceMemberListResponseStatus);

    ({ members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(1);
  });

  it('does not list workspace members of other workspaces', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      include: { user: true },
    });

    const { user: otherUser } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const otherWorkspace = workspaceCreationResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const memberInOtherWorkspace = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: otherWorkspace.id, userId: user.id } },
      include: { user: true },
    });

    const memberResponse = await supertest(app)
      .post(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const otherMember = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    let memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceMemberListResponseStatus);

    let { members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody;

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(1);

    memberListResponse = await supertest(app)
      .get(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(200 satisfies WorkspaceMemberListResponseStatus);

    ({ members, total } = memberListResponse.body as WorkspaceMemberListSuccessResponseBody);

    expect(members).toHaveLength(2);
    expect(members[0]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(otherMember);
    expect(members[1]).toEqual<WorkspaceMemberCreationSuccessResponseBody>(
      toWorkspaceMemberResponse(memberInOtherWorkspace),
    );

    expect(total).toBe(2);
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const memberListResponse = await supertest(app)
      .get(`/workspaces/unknown/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(403 satisfies WorkspaceMemberListResponseStatus);
    expect(memberListResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/unknown'.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const otherWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherWorkspace).not.toBeNull();

    let memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(403 satisfies WorkspaceMemberListResponseStatus);
    expect(memberListResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    memberListResponse = await supertest(app)
      .get(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(memberListResponse.status).toBe(403 satisfies WorkspaceMemberListResponseStatus);
    expect(memberListResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${otherWorkspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const memberListResponse = await supertest(app).get(
      `/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(memberListResponse.status).toBe(401 satisfies WorkspaceMemberListResponseStatus);
    expect(memberListResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const memberListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(memberListResponse.status).toBe(401 satisfies WorkspaceMemberListResponseStatus);
    expect(memberListResponse.body).toEqual<WorkspaceGetByIdForbiddenResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
