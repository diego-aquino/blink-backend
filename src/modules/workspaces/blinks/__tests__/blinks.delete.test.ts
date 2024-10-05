import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceMemberPath } from '../../members/router';
import { WorkspaceMemberCreationResponseStatus } from '../../members/types';
import { WorkspaceCreationMemberInput } from '../../members/validators';
import { BlinkPath } from '../router';
import { BlinkCreationInput } from '../validators';
import { BlinkCreationResponseStatus, BlinkCreationSuccessResponseBody } from '../types';
import WorkspaceService from '../../WorkspaceService';
import { WorkspaceMemberType } from '@prisma/client';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Blinks: Delete', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes a blink as its creator', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: otherUser,
      redirectId: expect.any(String),
      workspaceId: workspace.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(204);

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(0);
  });

  it('deletes a blink as an administrator of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });
    expect(member.type).toBe('ADMINISTRATOR' satisfies WorkspaceMemberType);

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: otherUser,
      redirectId: expect.any(String),
      workspaceId: workspace.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(204);

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(0);
  });

  it('returns an error if the blink does not exist', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(404);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'NOT_FOUND',
      message: "Blink 'unknown' not found.",
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const blinkDeletionResponse = await supertest(app)
      .delete('/workspaces/unknown/blinks/unknown' satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(403);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not the creator of the blink nor an administrator of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201);
    expect(blinkCreationResponse.body).toEqual({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201);

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/${blinkCreationResponse.body.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(403);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}/blinks/${blinkCreationResponse.body.id}'.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201);
    expect(blinkCreationResponse.body).toEqual({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { cookies: otherCookies } = await createAuthenticatedUser(app);

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/${blinkCreationResponse.body.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkDeletionResponse.status).toBe(403);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201);
    expect(blinkCreationResponse.body).toEqual({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkDeletionResponse = await supertest(app).delete(
      `/workspaces/${workspace.id}/blinks/${blinkCreationResponse.body.id}` satisfies BlinkPath.NonLiteral,
    );

    expect(blinkDeletionResponse.status).toBe(401);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201);
    expect(blinkCreationResponse.body).toEqual({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkDeletionResponse = await supertest(app)
      .delete(`/workspaces/${workspace.id}/blinks/${blinkCreationResponse.body.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(blinkDeletionResponse.status).toBe(401);
    expect(blinkDeletionResponse.body).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
