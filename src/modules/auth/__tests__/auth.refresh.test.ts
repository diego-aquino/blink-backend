import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import {
  AccessTokenPayload,
  LogoutResponseStatus,
  RefreshAuthBadRequestResponseBody,
  RefreshAuthResponseStatus,
  RefreshAuthUnauthorizedResponseBody,
} from '@/modules/auth/types';
import { verifyJWT } from '@/utils/auth';
import database from '@/database/client';

import { AuthPath } from '../router';
import { readCookie } from '@/utils/cookies';
import { ACCESS_COOKIE_NAME } from '../constants';

describe('Auth: Refresh', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('generates a new access token', async () => {
    const { user, auth, cookies } = await createAuthenticatedUser(app);

    const refreshResponse = await supertest(app)
      .post('/auth/refresh' satisfies AuthPath)
      .set('cookie', cookies.refresh.raw);

    expect(refreshResponse.status).toBe(204 satisfies RefreshAuthResponseStatus);

    const newCookies = refreshResponse.get('Set-Cookie') ?? [];

    const newAccessCookie = readCookie(ACCESS_COOKIE_NAME, newCookies)!;
    expect(newAccessCookie).toBeDefined();

    const newAccessToken = newAccessCookie.value;
    expect(newAccessToken).toEqual(expect.any(String));

    expect(newAccessToken).not.toBe(auth.accessToken);

    const [accessTokenPayload, newAccessTokenPayload] = await Promise.all([
      verifyJWT<AccessTokenPayload>(auth.accessToken),
      verifyJWT<AccessTokenPayload>(newAccessToken),
    ]);

    expect(newAccessTokenPayload.userId).toBe(accessTokenPayload.userId);
    expect(newAccessTokenPayload.sessionId).toBe(accessTokenPayload.sessionId);

    const newAccessTokenExpiration = new Date(newAccessTokenPayload.exp! * 1000);

    expect(newAccessCookie.properties.get('Domain')).toBe('localhost');
    expect(newAccessCookie.properties.get('Path')).toBe('/');
    expect(newAccessCookie.properties.get('Expires')).toBe(newAccessTokenExpiration.toUTCString());
    expect(newAccessCookie.properties.get('HttpOnly')).toBe('');
    expect(newAccessCookie.properties.get('SameSite')).toBe('Strict');

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(newAccessTokenPayload.sessionId);
  });

  it('returns an error if the session does not exist', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .set('cookie', cookies.access.raw);

    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(0);

    const refreshResponse = await supertest(app)
      .post('/auth/refresh' satisfies AuthPath)
      .set('cookie', cookies.refresh.raw);

    expect(refreshResponse.status).toBe(401 satisfies RefreshAuthResponseStatus);
    expect(refreshResponse.body).toEqual<RefreshAuthUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });

  it('returns an error if trying to refresh with invalid inputs', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .set('cookie', cookies.access.raw);

    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(0);

    const refreshResponse = await supertest(app).post('/auth/refresh' satisfies AuthPath);

    expect(refreshResponse.status).toBe(401 satisfies RefreshAuthResponseStatus);
    expect(refreshResponse.body).toEqual<RefreshAuthBadRequestResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
