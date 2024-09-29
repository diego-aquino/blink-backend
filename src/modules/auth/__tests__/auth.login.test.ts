import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import {
  AccessTokenPayload,
  LoginBadRequestResponseBody,
  LoginRequestBody,
  LoginResponseStatus,
  LoginUnauthorizedResponseBody,
  RefreshTokenPayload,
} from '@/modules/auth/types';
import { JWT_AUDIENCE, JWT_ISSUER, verifyJWT } from '@/utils/auth';
import database from '@/database/client';

import { AuthPath } from '../router';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../constants';
import { readCookie } from '@/utils/cookies';

describe('Auth: Log in', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('logs in', async () => {
    const { user, auth, cookies } = await createAuthenticatedUser(app);

    expect(auth.accessToken).toEqual(expect.any(String));

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);
    expect(accessTokenPayload).toEqual<AccessTokenPayload>({
      sessionId: expect.any(String),
      userId: user.id,
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    const accessTokenExpiration = new Date(accessTokenPayload.exp! * 1000);

    expect(cookies.access.properties.get('Domain')).toBe('localhost');
    expect(cookies.access.properties.get('Path')).toBe('/');
    expect(cookies.access.properties.get('Expires')).toBe(accessTokenExpiration.toUTCString());
    expect(cookies.access.properties.get('HttpOnly')).toBe('');
    expect(cookies.access.properties.get('SameSite')).toBe('Strict');

    expect(auth.refreshToken).toEqual(expect.any(String));

    const refreshTokenPayload = await verifyJWT<RefreshTokenPayload>(auth.refreshToken);

    expect(refreshTokenPayload).toEqual<RefreshTokenPayload>({
      sessionId: refreshTokenPayload.sessionId,
      userId: user.id,
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    const refreshTokenExpiration = new Date(refreshTokenPayload.exp! * 1000);

    expect(cookies.refresh.properties.get('Domain')).toBe('localhost');
    expect(cookies.refresh.properties.get('Path')).toBe('/auth/refresh');
    expect(cookies.refresh.properties.get('Expires')).toBe(refreshTokenExpiration.toUTCString());
    expect(cookies.refresh.properties.get('HttpOnly')).toBe('');
    expect(cookies.refresh.properties.get('SameSite')).toBe('Strict');

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(accessTokenPayload.sessionId);
  });

  it('logs into multiple sessions', async () => {
    const { user, auth, cookies } = await createAuthenticatedUser(app);

    const loginResponse = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: user.email,
        password: auth.password,
      } satisfies LoginRequestBody);

    expect(loginResponse.status).toBe(204 satisfies LoginResponseStatus);

    const newCookies = loginResponse.get('Set-Cookie') ?? [];

    const newAccessToken = readCookie(ACCESS_COOKIE_NAME, newCookies)!.value;
    expect(newAccessToken).toEqual(expect.any(String));

    const newRefreshToken = readCookie(REFRESH_COOKIE_NAME, newCookies)!.value;
    expect(newRefreshToken).toEqual(expect.any(String));

    expect(newAccessToken).not.toBe(newRefreshToken);
    expect(newAccessToken).not.toBe(cookies.access.value);
    expect(newRefreshToken).not.toBe(cookies.refresh.value);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    const [accessTokenPayload, newAccessTokenPayload] = await Promise.all([
      verifyJWT<AccessTokenPayload>(cookies.access.value),
      verifyJWT<AccessTokenPayload>(newAccessToken),
    ]);

    expect(newAccessTokenPayload.sessionId).not.toBe(accessTokenPayload.sessionId);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe(accessTokenPayload.sessionId);
    expect(sessions[1].id).toBe(newAccessTokenPayload.sessionId);
  });

  it('returns an error if the email does not exist', async () => {
    const nonexistentEmail = 'nonexistent-email@email.com';

    expect(
      await database.client.user.findMany({
        where: { email: nonexistentEmail },
      }),
    ).toHaveLength(0);

    const loginResponse = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: 'nonexistent-email@email.com',
        password: 'password',
      });

    expect(loginResponse.status).toBe(401 satisfies LoginResponseStatus);
    expect(loginResponse.body).toEqual<LoginUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });

  it('returns an error if the password is incorrect', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const incorrectPassword = 'incorrect-password';
    expect(auth.password).not.toBe(incorrectPassword);

    const loginResponse = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: user.email,
        password: incorrectPassword,
      });

    expect(loginResponse.status).toBe(401 satisfies LoginResponseStatus);
    expect(loginResponse.body).toEqual<LoginUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });

  it('returns an error if the login input are invalid', async () => {
    const loginResponse = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({ email: 'invalid' });

    expect(loginResponse.status).toBe(400 satisfies LoginResponseStatus);
    expect(loginResponse.body).toEqual<LoginBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          validation: 'email',
          code: 'invalid_string',
          message: 'Invalid email',
          path: ['email'],
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['password'],
          message: 'Required',
        },
      ],
    });
  });
});
