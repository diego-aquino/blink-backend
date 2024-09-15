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
import { BlinkCreationInput, BlinkUpdateInput } from '../validators';
import {
  BlinkCreationBadRequestResponseBody,
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
  BlinkUpdateResponseStatus,
  BlinkUpdateSuccessResponseBody,
} from '../types';
import WorkspaceService from '../../WorkspaceService';
import { WorkspaceMemberType } from '@prisma/client';

describe('Blinks: Update', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates a blink as its creator', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: otherUser,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const updateInput = {
      name: 'Blink (updated)',
      url: 'https://example.com/updated',
      redirectId: `${blink.redirectId}-updated`,
    } satisfies BlinkUpdateInput.Body;

    for (const [updateKey, updateValue] of Object.entries(updateInput)) {
      expect(updateValue).not.toBe(blink[updateKey]);
    }

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(blinkUpdateResponse.status).toBe(200 satisfies BlinkUpdateResponseStatus);

    const updatedBlink = blinkUpdateResponse.body as BlinkUpdateSuccessResponseBody;

    expect(updatedBlink).toEqual<BlinkUpdateSuccessResponseBody>({
      id: blink.id,
      name: updateInput.name,
      url: updateInput.url,
      creator: otherUser,
      redirectId: updateInput.redirectId,
      createdAt: blink.createdAt,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedBlink.updatedAt).getTime()).toBeGreaterThan(new Date(blink.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(1);
    expect(workspaceInDatabase.blinks[0].name).toBe(updateInput.name);
    expect(workspaceInDatabase.blinks[0].url).toBe(updateInput.url);
    expect(workspaceInDatabase.blinks[0].redirectId).toBe(updateInput.redirectId);
  });

  it('updates a blink as an administrator of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const member = await database.client.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });
    expect(member.type).toBe('ADMINISTRATOR' satisfies WorkspaceMemberType);

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: otherUser,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const updateInput = {
      name: 'Blink (updated)',
      url: 'https://example.com/updated',
      redirectId: `${blink.redirectId}-updated`,
    } satisfies BlinkUpdateInput.Body;

    for (const [updateKey, updateValue] of Object.entries(updateInput)) {
      expect(updateValue).not.toBe(blink[updateKey]);
    }

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(blinkUpdateResponse.status).toBe(200 satisfies BlinkUpdateResponseStatus);

    const updatedBlink = blinkUpdateResponse.body as BlinkUpdateSuccessResponseBody;

    expect(updatedBlink).toEqual<BlinkUpdateSuccessResponseBody>({
      id: blink.id,
      name: updateInput.name,
      url: updateInput.url,
      creator: otherUser,
      redirectId: updateInput.redirectId,
      createdAt: blink.createdAt,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedBlink.updatedAt).getTime()).toBeGreaterThan(new Date(blink.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(1);
    expect(workspaceInDatabase.blinks[0].name).toBe(updateInput.name);
    expect(workspaceInDatabase.blinks[0].url).toBe(updateInput.url);
    expect(workspaceInDatabase.blinks[0].redirectId).toBe(updateInput.redirectId);
  });

  it('updates a blink with unchanged inputs', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const updateInput = input satisfies BlinkUpdateInput.Body;

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(blinkUpdateResponse.status).toBe(200 satisfies BlinkUpdateResponseStatus);

    const updatedBlink = blinkUpdateResponse.body as BlinkUpdateSuccessResponseBody;

    expect(updatedBlink).toEqual<BlinkUpdateSuccessResponseBody>({
      id: blink.id,
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: blink.redirectId,
      createdAt: blink.createdAt,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedBlink.updatedAt).getTime()).toBeGreaterThan(new Date(blink.updatedAt).getTime());

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(1);
    expect(workspaceInDatabase.blinks[0].name).toBe(input.name);
    expect(workspaceInDatabase.blinks[0].url).toBe(input.url);
    expect(workspaceInDatabase.blinks[0].redirectId).toBe(blink.redirectId);
  });

  it('returns an error if trying to update a blink with invalid inputs', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        // @ts-expect-error
        name: 1,
        url: 'invalid',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(400 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          message: 'Expected string, received number',
          path: ['name'],
        },
        {
          code: 'invalid_string',
          message: 'Invalid url',
          validation: 'url',
          path: ['url'],
        },
      ],
    });
  });

  it('returns an error if trying to update a blink to a redirect id already in use by the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const otherInput = {
      name: 'Other Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const otherBlinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(otherInput);

    expect(otherBlinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const otherBlink = otherBlinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(otherBlink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: otherInput.name,
      url: otherInput.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
        redirectId: otherBlink.redirectId,
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(409 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'CONFLICT',
      message: `Blink redirect '${otherBlink.redirectId}' already exists.`,
    });
  });

  it('returns an error if trying to update a blink to a redirect id already in use by other workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const otherWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherWorkspace).not.toBeNull();

    const otherInput = {
      name: 'Other Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const otherBlinkCreationResponse = await supertest(app)
      .post(`/workspaces/${otherWorkspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(otherInput);

    expect(otherBlinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const otherBlink = otherBlinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(otherBlink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: otherInput.name,
      url: otherInput.url,
      creator: otherUser,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
        redirectId: otherBlink.redirectId,
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(409 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'CONFLICT',
      message: `Blink redirect '${otherBlink.redirectId}' already exists.`,
    });
  });

  it('returns an error if the blink does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(404 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'NOT_FOUND',
      message: "Blink 'unknown' not found.",
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const blinkUpdateResponse = await supertest(app)
      .patch('/workspaces/unknown/blinks/unknown' satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(403 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { auth: otherAuth } = await createAuthenticatedUser(app);

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(403 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if not the creator of the blink nor an administrator of the workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const memberCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/members` satisfies WorkspaceMemberPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ userId: otherUser.id, type: 'DEFAULT' } satisfies WorkspaceCreationMemberInput.Body);

    expect(memberCreationResponse.status).toBe(201 satisfies WorkspaceMemberCreationResponseStatus);

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(403 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}/blinks/${blink.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(401 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const blinkUpdateResponse = await supertest(app)
      .patch(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .auth('invalid', { type: 'bearer' })
      .send({
        name: 'Blink (updated)',
        url: 'https://example.com/updated',
      } satisfies BlinkUpdateInput.Body);

    expect(blinkUpdateResponse.status).toBe(401 satisfies BlinkUpdateResponseStatus);
    expect(blinkUpdateResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
