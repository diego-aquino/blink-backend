import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import {
  AccessTokenPayload,
  LogoutResponseStatus,
  RefreshAuthBadRequestResponseBody,
  RefreshAuthRequestBody,
  RefreshAuthResponseStatus,
  RefreshAuthSuccessResponseBody,
  RefreshAuthUnauthorizedResponseBody,
} from '@/modules/auth/types';
import { verifyJWT } from '@/utils/auth';
import database from '@/database/client';

import { AuthPath } from '../router';

describe('Auth: Refresh', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('generates a new access token', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post('/auth/refresh' satisfies AuthPath)
      .send({ refreshToken: auth.refreshToken } satisfies RefreshAuthRequestBody);

    expect(response.status).toBe(200 satisfies RefreshAuthResponseStatus);

    const newAuth = response.body as RefreshAuthSuccessResponseBody;

    expect(newAuth).toEqual<RefreshAuthSuccessResponseBody>({
      accessToken: expect.any(String),
    });

    expect(newAuth.accessToken).not.toBe(auth.accessToken);

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);
    const newAccessTokenPayload = await verifyJWT<AccessTokenPayload>(newAuth.accessToken);

    expect(newAccessTokenPayload.userId).toBe(accessTokenPayload.userId);
    expect(newAccessTokenPayload.sessionId).toBe(accessTokenPayload.sessionId);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(newAccessTokenPayload.sessionId);
  });

  it('returns an error if the session does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(0);

    const response = await supertest(app)
      .post('/auth/refresh' satisfies AuthPath)
      .send({ refreshToken: auth.refreshToken } satisfies RefreshAuthRequestBody);

    expect(response.status).toBe(401 satisfies RefreshAuthResponseStatus);
    expect(response.body).toEqual<RefreshAuthUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });

  it('returns an error if trying to refresh with invalid inputs', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(0);

    // @ts-expect-error
    const input: RefreshAuthRequestBody = {};

    const response = await supertest(app)
      .post('/auth/refresh' satisfies AuthPath)
      .send(input);

    expect(response.status).toBe(400 satisfies RefreshAuthResponseStatus);
    expect(response.body).toEqual<RefreshAuthBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['refreshToken'],
          message: 'Required',
        },
      ],
    });
  });
});
