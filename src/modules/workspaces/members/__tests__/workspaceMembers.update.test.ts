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
  CreateWorkspaceMemberResponseStatus,
  CreateWorkspaceMemberBadRequestResponseBody,
  CreateWorkspaceMemberForbiddenResponseBody,
  UpdateWorkspaceMemberRequestBody,
  UpdateWorkspaceMemberResponseStatus,
  UpdateWorkspaceMemberSuccessResponseBody,
  CreateWorkspaceMemberSuccessResponseBody,
} from '../types';
import { CreateWorkspaceMemberInput } from '../validators';
import { WorkspaceMemberType } from '@prisma/client';

describe('Workspace members: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates the type of a workspace member', async () => {
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

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(200 satisfies UpdateWorkspaceMemberResponseStatus);

    const updatedMember = memberUpdateResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    expect(updatedMember).toEqual<UpdateWorkspaceMemberSuccessResponseBody>({
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

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(memberInput);

    expect(memberUpdateResponse.status).toBe(200 satisfies UpdateWorkspaceMemberResponseStatus);

    const updatedMember = memberUpdateResponse.body as CreateWorkspaceMemberSuccessResponseBody;

    expect(updatedMember).toEqual<UpdateWorkspaceMemberSuccessResponseBody>({
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

    // @ts-expect-error
    const updateInput = { type: 1 } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(400 satisfies UpdateWorkspaceMemberResponseStatus);

    const validMemberTypes = Object.values(WorkspaceMemberType).sort();
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceMemberBadRequestResponseBody>({
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
    const { auth } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'Workspace' } satisfies CreateWorkspaceInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = workspaceCreationResponse.body as CreateWorkspaceSuccessResponseBody;

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/unknown` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(404 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
      code: 'NOT_FOUND',
      message: `Workspace member 'unknown' not found.`,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch('/workspaces/unknown/members/unknown' satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
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

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
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

    const { auth: anotherAuth } = await createAuthenticatedUser(app);

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(anotherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(403 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceMemberForbiddenResponseBody>({
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
    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(401 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
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

    const updateInput = { type: 'ADMINISTRATOR' } satisfies UpdateWorkspaceMemberRequestBody;

    const memberUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/members/${member.id}` satisfies WorkspaceMemberPath.NonLiteral)
      .auth('invalid', { type: 'bearer' })
      .send(updateInput);

    expect(memberUpdateResponse.status).toBe(401 satisfies UpdateWorkspaceMemberResponseStatus);
    expect(memberUpdateResponse.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
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
