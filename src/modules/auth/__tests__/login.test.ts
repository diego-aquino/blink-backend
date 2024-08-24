import { clearDatabase } from '@tests/utils/database';
import { beforeEach, describe, expect, it } from 'vitest';
import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import {
  AccessTokenPayload,
  LoginResponseStatus,
  LoginSuccessResponseBody,
  LoginUnauthorizedResponseBody,
  RefreshTokenPayload,
} from '@/modules/auth/types';
import { JWT_AUDIENCE, JWT_ISSUER, verifyJWT } from '@/utils/auth';
import supertest from 'supertest';
import database from '@/database/client';
import { AuthPath } from '../router';

describe('Auth: Log in', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should support logging in', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    expect(auth).toEqual<LoginSuccessResponseBody>({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(auth.accessToken).not.toBe(auth.refreshToken);

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);
    expect(accessTokenPayload).toEqual<AccessTokenPayload>({
      sessionId: expect.any(String),
      userId: user.id,
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    const refreshTokenPayload = await verifyJWT<RefreshTokenPayload>(auth.refreshToken);
    expect(refreshTokenPayload).toEqual<RefreshTokenPayload>({
      sessionId: accessTokenPayload.sessionId,
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(accessTokenPayload.sessionId);
  });

  it('should support logging into multiple sessions', async () => {
    const { user, password, auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: user.email,
        password,
      });

    expect(response.status).toBe(200 satisfies LoginResponseStatus);

    const newAuth = response.body as LoginSuccessResponseBody;

    expect(newAuth).toEqual<LoginSuccessResponseBody>({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(newAuth.accessToken).not.toBe(newAuth.refreshToken);
    expect(newAuth.accessToken).not.toBe(auth.accessToken);
    expect(newAuth.refreshToken).not.toBe(auth.refreshToken);

    const sessions = await database.client.userSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);
    const newAccessTokenPayload = await verifyJWT<AccessTokenPayload>(newAuth.accessToken);

    expect(newAccessTokenPayload.sessionId).not.toBe(accessTokenPayload.sessionId);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe(accessTokenPayload.sessionId);
    expect(sessions[1].id).toBe(newAccessTokenPayload.sessionId);
  });

  it('should return an error if the email does not exist', async () => {
    const nonexistentEmail = 'nonexistent-email@email.com';

    expect(
      await database.client.user.findMany({
        where: { email: nonexistentEmail },
      }),
    ).toHaveLength(0);

    const response = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: 'nonexistent-email@email.com',
        password: 'password',
      });

    expect(response.status).toBe(401 satisfies LoginResponseStatus);

    expect(response.body).toEqual<LoginUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });

  it('should return an error if the password is incorrect', async () => {
    const { user, password } = await createAuthenticatedUser(app);

    const incorrectPassword = 'incorrect-password';
    expect(password).not.toBe(incorrectPassword);

    const response = await supertest(app)
      .post('/auth/login' satisfies AuthPath)
      .send({
        email: user.email,
        password: incorrectPassword,
      });

    expect(response.status).toBe(401 satisfies LoginResponseStatus);

    expect(response.body).toEqual<LoginUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
