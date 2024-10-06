import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlinkPath } from '../router';
import { BlinkCreationInput, BlinkListInput } from '../validators';
import {
  BlinkCreationBadRequestResponseBody,
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
  BlinkListResponseStatus,
  BlinkListSuccessResponseBody,
} from '../types';
import WorkspaceService from '../../WorkspaceService';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Blinks: List', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('lists blinks of a workspace with pagination', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    let blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const otherBlink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    let blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    let { blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody;

    expect(blinks).toHaveLength(2);
    expect(blinks[0]).toEqual<BlinkCreationSuccessResponseBody>(otherBlink);
    expect(blinks[1]).toEqual<BlinkCreationSuccessResponseBody>(blink);

    expect(total).toBe(2);

    blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .query({ page: 1, limit: 1 } satisfies BlinkListInput.RawQuery);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    ({ blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody);

    expect(blinks).toHaveLength(1);
    expect(blinks[0]).toEqual<BlinkCreationSuccessResponseBody>(otherBlink);

    expect(total).toBe(2);
  });

  it('filters blinks by case-insensitive name', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    let blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Other Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const otherBlink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

    let blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .query({ name: blink.name! } satisfies BlinkListInput.RawQuery);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    let { blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody;

    expect(blinks).toHaveLength(2);
    expect(blinks[0]).toEqual<BlinkCreationSuccessResponseBody>(otherBlink);
    expect(blinks[1]).toEqual<BlinkCreationSuccessResponseBody>(blink);

    expect(total).toBe(2);

    blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .query({ name: otherBlink.name!.slice(0, 3).toUpperCase() } satisfies BlinkListInput.RawQuery);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    ({ blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody);

    expect(blinks).toHaveLength(1);
    expect(blinks[0]).toEqual<BlinkCreationSuccessResponseBody>(otherBlink);

    blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .query({ name: 'unknown' } satisfies BlinkListInput.RawQuery);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    ({ blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody);

    expect(blinks).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('does not list blinks of other workspaces', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(workspace).not.toBeNull();

    let blinkCreationResponse = await supertest(app)
      .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw)
      .send({
        name: 'Blink',
        url: 'https://example.com',
      } satisfies BlinkCreationInput.Body);

    expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    const otherWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherWorkspace).not.toBeNull();

    let blinkListResponse = await supertest(app)
      .get(`/workspaces/${otherWorkspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkListResponse.status).toBe(200 satisfies BlinkListResponseStatus);

    let { blinks, total } = blinkListResponse.body as BlinkListSuccessResponseBody;

    expect(blinks).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('returns an error if the workspace does not exist', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    const blinkListResponse = await supertest(app)
      .get('/workspaces/unknown/blinks' satisfies BlinkPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(blinkListResponse.status).toBe(403 satisfies BlinkListResponseStatus);
    expect(blinkListResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
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

    const blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(blinkListResponse.status).toBe(403 satisfies BlinkListResponseStatus);
    expect(blinkListResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
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

    const blinkListResponse = await supertest(app).get(
      `/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral,
    );

    expect(blinkListResponse.status).toBe(401 satisfies BlinkListResponseStatus);
    expect(blinkListResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
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

    const blinkListResponse = await supertest(app)
      .get(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(blinkListResponse.status).toBe(401 satisfies BlinkListResponseStatus);
    expect(blinkListResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
