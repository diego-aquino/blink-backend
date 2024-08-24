import { clearDatabase } from '@tests/utils/database';
import { beforeEach, describe, expect, it } from 'vitest';
import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { AccessTokenPayload, LogoutResponseStatus, LogoutUnauthorizedResponseBody } from '@/modules/auth/types';
import { verifyJWT } from '@/utils/auth';
import supertest from 'supertest';
import database from '@/database/client';
import { AuthPath } from '../router';

describe('Auth: Log out', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should support logging out', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(204 satisfies LogoutResponseStatus);

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(auth.accessToken);

    const session = await database.client.userSession.findUnique({
      where: { id: accessTokenPayload.sessionId },
    });
    expect(session).toBe(null);
  });

  it('should still allow authenticated requests auth access token after logout, until expired', async () => {
    const { auth } = await createAuthenticatedUser(app);

    let response = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(204 satisfies LogoutResponseStatus);

    response = await supertest(app)
      .post('/auth/logout' satisfies AuthPath)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(response.status).toBe(204 satisfies LogoutResponseStatus);
  });

  it('should return an error if not authenticated', async () => {
    const response = await supertest(app).post('/auth/logout');

    expect(response.status).toBe(401 satisfies LogoutResponseStatus);

    expect(response.body).toEqual<LogoutUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('should return an error if the access token is invalid', async () => {
    const response = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies LogoutResponseStatus);

    expect(response.body).toEqual<LogoutUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
