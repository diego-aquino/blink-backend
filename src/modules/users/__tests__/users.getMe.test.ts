import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { clearDatabase } from '@tests/utils/database';
import database from '@/database/client';

import { UserPath } from '../router';
import {
  UserGetMeNotFoundResponseBody,
  UserGetMeResponseStatus,
  UserGetMeSuccessResponseBody,
  UserGetMeUnauthorizedResponseBody,
} from '../types';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Users: Get me', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets the authenticated user', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const getUserResponse = await supertest(app)
      .get('/users/me' satisfies UserPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getUserResponse.status).toBe(200 satisfies UserGetMeResponseStatus);

    const fetchedUser = getUserResponse.body as UserGetMeSuccessResponseBody;
    expect(fetchedUser).toEqual(user);
  });

  it('returns an error if the user does not exist', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const getUserResponse = await supertest(app)
      .get('/users/me' satisfies UserPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getUserResponse.status).toBe(404 satisfies UserGetMeResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetMeNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const getUserResponse = await supertest(app).get('/users/me' satisfies UserPath.NonLiteral);

    expect(getUserResponse.status).toBe(401 satisfies UserGetMeResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetMeUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const getUserResponse = await supertest(app).get('/users/me').set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(getUserResponse.status).toBe(401 satisfies UserGetMeResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetMeUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
