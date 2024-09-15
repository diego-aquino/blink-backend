import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../../router';
import {
  CreateWorkspaceResponseStatus,
  GetWorkspaceByIdForbiddenResponseBody,
  ListWorkspacesResponseStatus,
} from '../../types';
import { CreateWorkspaceInput, ListWorkspacesInput } from '../../validators';
import { WorkspaceMemberPath } from '../router';
import {
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberSuccessResponseBody,
  ListWorkspaceMembersResponseStatus,
  ListWorkspaceMembersSuccessResponseBody,
} from '../types';
import { CreateWorkspaceMemberInput } from '../validators';
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
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies CreateWorkspaceMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const otherMember = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    let response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspaceMembersResponseStatus);

    let { members, total } = response.body as ListWorkspaceMembersSuccessResponseBody;

    expect(members).toHaveLength(2);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(otherMember);
    expect(members[1]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(2);

    response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 1, limit: 1 } satisfies ListWorkspacesInput);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ members, total } = response.body as ListWorkspaceMembersSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(otherMember);

    expect(total).toBe(2);

    response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 2, limit: 1 } satisfies ListWorkspacesInput);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ members, total } = response.body as ListWorkspaceMembersSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(2);

    response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ page: 3, limit: 1 } satisfies ListWorkspacesInput);

    expect(response.status).toBe(200 satisfies ListWorkspacesResponseStatus);

    ({ members, total } = response.body as ListWorkspaceMembersSuccessResponseBody);

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
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies CreateWorkspaceMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const otherMember = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    let searchName = otherUser.name.slice(0, 10).toUpperCase();
    expect(searchName).not.toBe(user.name);
    expect(searchName).not.toBe(otherUser.name);

    let response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: searchName } satisfies ListWorkspacesInput.Raw);

    expect(response.status).toBe(200 satisfies ListWorkspaceMembersResponseStatus);

    let { members, total } = response.body as ListWorkspaceMembersSuccessResponseBody;

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(otherMember);

    expect(total).toBe(1);

    searchName = user.name;
    expect(searchName).not.toBe(otherUser.name);

    response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .query({ name: searchName } satisfies ListWorkspacesInput.Raw);

    expect(response.status).toBe(200 satisfies ListWorkspaceMembersResponseStatus);

    ({ members, total } = response.body as ListWorkspaceMembersSuccessResponseBody);

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(toWorkspaceMemberResponse(member));

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
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const otherWorkspace = workspaceCreationResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    const memberInOtherWorkspace = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: otherWorkspace.id, userId: user.id } },
      include: { user: true },
    });

    const memberResponse = await supertest(app)
      .post(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'ADMINISTRATOR' } satisfies CreateWorkspaceMemberInput.Body);

    expect(memberResponse.status).toBe(201 satisfies CreateWorkspaceMemberResponseStatus);

    const otherMember = memberResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    let response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspaceMembersResponseStatus);

    let { members, total } = response.body as ListWorkspaceMembersSuccessResponseBody;

    expect(members).toHaveLength(1);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(toWorkspaceMemberResponse(member));

    expect(total).toBe(1);

    response = await supertest(app)
      .get(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(200 satisfies ListWorkspaceMembersResponseStatus);

    ({ members, total } = response.body as ListWorkspaceMembersSuccessResponseBody);

    expect(members).toHaveLength(2);
    expect(members[0]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(otherMember);
    expect(members[1]).toEqual<CreateWorkspaceMemberSuccessResponseBody>(
      toWorkspaceMemberResponse(memberInOtherWorkspace),
    );

    expect(total).toBe(2);
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .get(`/workspaces/unknown/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(403 satisfies ListWorkspaceMembersResponseStatus);
    expect(response.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
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

    let response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(403 satisfies ListWorkspaceMembersResponseStatus);
    expect(response.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    response = await supertest(app)
      .get(`/workspaces/${otherWorkspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(403 satisfies ListWorkspaceMembersResponseStatus);
    expect(response.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${otherWorkspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const response = await supertest(app).get(
      `/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral,
    );

    expect(response.status).toBe(401 satisfies ListWorkspaceMembersResponseStatus);
    expect(response.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const response = await supertest(app)
      .get(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies ListWorkspaceMembersResponseStatus);
    expect(response.body).toEqual<GetWorkspaceByIdForbiddenResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
