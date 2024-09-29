import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlinkPath } from '../router';
import { BlinkCreationInput } from '../validators';
import {
  BlinkCreationBadRequestResponseBody,
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
  BlinkGetByIdResponseStatus,
  BlinkGetByIdSuccessResponseBody,
} from '../types';
import WorkspaceService from '../../WorkspaceService';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Blinks: Get', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets a blink by id', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    const blinkGetResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks/${blink.id}` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkGetResponse.status).toBe(200 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkGetByIdSuccessResponseBody>(blink);
  });

  it('returns an error if the blink does not exist', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    const blinkGetResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkGetResponse.status).toBe(404 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'NOT_FOUND',
      message: "Blink 'unknown' not found.",
    });
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const blinkGetResponse = await supertest(app)
      .get('/workspaces/unknown/blinks/unknown' satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkGetResponse.status).toBe(403 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: "Operation not allowed on resource '/workspaces/unknown'.",
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

    const blinkGetResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkGetResponse.status).toBe(403 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/workspaces/${workspace.id}'.`,
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

    const blinkGetResponse = await supertest(app).get(
      `/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral,
    );

    expect(blinkGetResponse.status).toBe(401 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
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
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(401 satisfies BlinkCreationResponseStatus);

    const blinkGetResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks/unknown` satisfies BlinkPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(blinkGetResponse.status).toBe(401 satisfies BlinkGetByIdResponseStatus);
    expect(blinkGetResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
