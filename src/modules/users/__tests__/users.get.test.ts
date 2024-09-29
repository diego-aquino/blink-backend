import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { clearDatabase } from '@tests/utils/database';
import database from '@/database/client';

import { UserPath } from '../router';
import {
  UserGetByIdForbiddenResponseBody,
  UserGetByIdNotFoundResponseBody,
  UserGetByIdResponseStatus,
  UserGetByIdSuccessResponseBody,
  UserGetByIdUnauthorizedResponseBody,
} from '../types';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Users: Get', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets a user by id as oneself', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const getUserResponse = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getUserResponse.status).toBe(200 satisfies UserGetByIdResponseStatus);

    const gotUser = getUserResponse.body as UserGetByIdSuccessResponseBody;

    expect(gotUser).toEqual(user);
  });

  it('returns an error if the user does not exist', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const getUserResponse = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getUserResponse.status).toBe(404 satisfies UserGetByIdResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('returns an error if trying to get a user as a different user', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);
    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    let getUserResponse = await supertest(app)
      .get(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .set('cookie', cookies.access.raw);

    expect(getUserResponse.status).toBe(403 satisfies UserGetByIdResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${otherUser.id}'.`,
    });

    getUserResponse = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .set('cookie', otherCookies.access.raw);

    expect(getUserResponse.status).toBe(403 satisfies UserGetByIdResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${user.id}'.`,
    });
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const getUserResponse = await supertest(app).get(`/users/${user.id}` satisfies UserPath.NonLiteral);

    expect(getUserResponse.status).toBe(401 satisfies UserGetByIdResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const { user } = await createAuthenticatedUser(app);

    const getUserResponse = await supertest(app)
      .get(`/users/${user.id}`)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(getUserResponse.status).toBe(401 satisfies UserGetByIdResponseStatus);
    expect(getUserResponse.body).toEqual<UserGetByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
