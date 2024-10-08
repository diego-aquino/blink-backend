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
  WorkspaceMemberCreationResponseStatus,
  WorkspaceMemberCreationBadRequestResponseBody,
  WorkspaceMemberCreationForbiddenResponseBody,
  WorkspaceMemberUpdateRequestBody,
  WorkspaceMemberUpdateResponseStatus,
  WorkspaceMemberUpdateSuccessResponseBody,
  WorkspaceMemberCreationSuccessResponseBody,
} from '../types';
import { WorkspaceCreationMemberInput } from '../validators';
import { WorkspaceMemberType } from '@prisma/client';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspace members: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates the type of a workspace member', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(200 satisfies WorkspaceMemberUpdateResponseStatus);

    const updatedMember = memberUpdateResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    expect(updatedMember).toEqual<WorkspaceMemberUpdateSuccessResponseBody>({
      id: member.id,
      user: otherUser,
      type: 'ADMINISTRATOR',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedMember.updatedAt).getTime()).toBeGreaterThan(new Date(member.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(updateInput.type);
  });

  it('updates a workspace member with unchanged inputs', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberUpdateResponse.status).toBe(200 satisfies WorkspaceMemberUpdateResponseStatus);

    const updatedMember = memberUpdateResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    expect(updatedMember).toEqual<WorkspaceMemberUpdateSuccessResponseBody>({
      id: member.id,
      user: otherUser,
      type: 'DEFAULT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedMember.updatedAt).getTime()).toBeGreaterThan(new Date(member.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(memberInput.type);
  });

  it('returns an error if trying to update a workspace member with invalid inputs', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    // @ts-expect-error
    const updateInput = { type: 1 } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(400 satisfies WorkspaceMemberUpdateResponseStatus);

    const validMemberTypes = Object.values(WorkspaceMemberType).sort();
    expect(memberUpdateResponse.body).toEqual<WorkspaceMemberCreationBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_enum_value',
          message: `Invalid enum value. Expected ${validMemberTypes.map((type) => `'${type}'`).join(' | ')}, received '1'`,
          options: validMemberTypes,
          path: ['type'],
          received: 1,
        },
      ],
    });
  });

  it('returns an error if the workspace member does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(404 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
      code: 'NOT_FOUND',
      message: `Workspace member 'unknown' not found.`,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch('/workspaces/unknown/members/unknown' satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
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

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(memberInput.type);
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const { cookies: otherOtherCookies } = await createAuthenticatedUser(app);

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', otherOtherCookies.access.raw)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceMemberCreationForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(memberInput.type);
  });

  it('returns an error if not authenticated', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;
    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(401 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(memberInput.type);
  });

  it('returns an error if the access token is invalid', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser } = await createAuthenticatedUser(app);

    const memberInput: WorkspaceCreationMemberInput.Body = { userId: otherUser.id, type: 'DEFAULT' };

    const memberResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(memberInput);

    expect(memberResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const member = memberResponse.body as WorkspaceMemberCreationSuccessResponseBody;

    const updateInput = { type: 'ADMINISTRATOR' } satisfies WorkspaceMemberUpdateRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(401 satisfies WorkspaceMemberUpdateResponseStatus);
    expect(memberUpdateResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.members).toHaveLength(2);
    expect(workspaceInDatabase.members[0].userId).toBe(user.id);
    expect(workspaceInDatabase.members[1].userId).toBe(otherUser.id);
    expect(workspaceInDatabase.members[1].type).toBe(memberInput.type);
  });
});
