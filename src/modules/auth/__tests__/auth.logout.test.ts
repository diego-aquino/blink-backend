import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import { AccessTokenPayload, LogoutResponseStatus, LogoutUnauthorizedResponseBody } from '@/modules/auth/types';
import { verifyJWT } from '@/utils/auth';
import database from '@/database/client';

import { AuthPath } from '../router';
import { ACCESS_COOKIE_NAME } from '../constants';

describe('Auth: Log out', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('logs out', async () => {
    const { auth, cookies } = await createAuthenticatedUser(app);

    const logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .set('cookie', cookies.access.raw);

    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);

    const session = await database.client.userSession.findUnique({
      where: { id: accessTokenPayload.sessionId },
    });
    expect(session).toBe(null);
  });

  it('accepts an existing access token, even after logout, until expired', async () => {
    const { cookies } = await createAuthenticatedUser(app);

    let logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .set('cookie', cookies.access.raw);

    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);

    logoutResponse = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .set('cookie', cookies.access.raw);

    expect(logoutResponse.status).toBe(204 satisfies LogoutResponseStatus);
  });

  it('returns an error if not authenticated', async () => {
    const logoutResponse = await supertest(app).post('/auth/logout');

    expect(logoutResponse.status).toBe(401 satisfies LogoutResponseStatus);
    expect(logoutResponse.body).toEqual<LogoutUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const logoutResponse = await supertest(app).post('/auth/logout').set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(logoutResponse.status).toBe(401 satisfies LogoutResponseStatus);
    expect(logoutResponse.body).toEqual<LogoutUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
