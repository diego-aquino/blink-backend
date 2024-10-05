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
import {
  BlinkCreationBadRequestResponseBody,
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
} from '../types';
import WorkspaceService from '../../WorkspaceService';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Blinks: Create', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it.each([{ redirectId: undefined }, { redirectId: '' }])(
    'creates a blink with an auto-generated redirect id: redirect id $redirectId',
    async ({ redirectId }) => {
      const { user, cookies } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const input = {
        name: 'Blink',
        url: 'https://example.com',
        redirectId,
      } satisfies BlinkCreationInput.Body;

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .set('cookie', cookies.access.raw)
        .send(input);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
        id: expect.any(String),
        name: input.name,
        url: input.url,
        creator: user,
        redirectId: expect.any(String),
        workspaceId: workspace.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
        where: { id: workspace.id },
        include: { blinks: { orderBy: { createdAt: 'asc' } } },
      });
      expect(workspaceInDatabase.blinks).toHaveLength(1);
      expect(workspaceInDatabase.blinks[0].name).toBe('Blink');
    },
  );

  it('creates a blink with a custom redirect id', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
      redirectId: 'custom',
    } satisfies BlinkCreationInput.Body;

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: input.redirectId,
      workspaceId: workspace.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(1);
    expect(workspaceInDatabase.blinks[0].name).toBe('Blink');
  });

  it('creates a blink as a regular workspace member', async () => {
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

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { blinks: { orderBy: { createdAt: 'asc' } } },
    });
    expect(workspaceInDatabase.blinks).toHaveLength(1);
    expect(workspaceInDatabase.blinks[0].name).toBe('Blink');
  });

  it('returns an error if trying to create a blink with invalid inputs', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        // @ts-expect-error
        name: 1,
        url: 'invalid',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(400 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
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
          path: ['url'],
          validation: 'url',
        },
      ],
    });
  });

  it('returns an error if a custom redirect id is already in use by the workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
      redirectId: 'custom',
    } satisfies BlinkCreationInput.Body;

    let blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: input.redirectId,
      workspaceId: workspace.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const otherInput = {
      name: 'Other Blink',
      url: 'https://example.com',
      redirectId: input.redirectId,
    } satisfies BlinkCreationInput.Body;

    blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(otherInput);

    expect(blinkCreationResponse.status).toBe(409 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'CONFLICT',
      message: `Blink redirect '${input.redirectId}' already exists.`,
    });
  });

  it('returns an error if a custom redirect id is already in use by other workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const input = {
      name: 'Blink',
      url: 'https://example.com',
      redirectId: 'custom',
    } satisfies BlinkCreationInput.Body;

    let blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    expect(blink).toEqual<BlinkCreationSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      url: input.url,
      creator: user,
      redirectId: input.redirectId,
      workspaceId: workspace.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const otherWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherWorkspace).not.toBeNull();

    const otherInput = {
      name: 'Other Blink',
      url: 'https://example.com',
      redirectId: input.redirectId,
    } satisfies BlinkCreationInput.Body;

    blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${otherWorkspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send(otherInput);

    expect(blinkCreationResponse.status).toBe(409 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'CONFLICT',
      message: `Blink redirect '${input.redirectId}' already exists.`,
    });
  });

  it('returns an error if not a member of the workspace', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const { cookies: otherCookies } = await createAuthenticatedUser(app);

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(403 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const blinkCreationResponse = await supertest(app)
      .post('/workspaces/unknown/blinks' satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(403 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(401 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(401 satisfies BlinkCreationResponseStatus);
    expect(blinkCreationResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
