import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { clearDatabase } from '@tests/utils/database';
import database from '@/database/client';

import { UserPath } from '../router';
import {
  GetUserByIdForbiddenResponseBody,
  GetUserByIdNotFoundResponseBody,
  GetUserByIdResponseStatus,
  GetUserByIdSuccessResponseBody,
  GetUserByIdUnauthorizedResponseBody,
} from '../types';

describe('Users: Get by id', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should support getting a user by id', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(200 satisfies GetUserByIdResponseStatus);

    const gotUser = response.body as GetUserByIdSuccessResponseBody;

    expect(gotUser).toEqual(user);
  });

  it('should return an error if the user does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const response = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(404 satisfies GetUserByIdResponseStatus);

    expect(response.body).toEqual<GetUserByIdNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('should return an error if getting a user different than authenticated', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    let response = await supertest(app)
      .get(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(403 satisfies GetUserByIdResponseStatus);

    expect(response.body).toEqual<GetUserByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${otherUser.id}'.`,
    });

    response = await supertest(app)
      .get(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(403 satisfies GetUserByIdResponseStatus);

    expect(response.body).toEqual<GetUserByIdForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${user.id}'.`,
    });
  });

  it('should return an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const response = await supertest(app).get(`/users/${user.id}` satisfies UserPath.NonLiteral);
    expect(response.status).toBe(401 satisfies GetUserByIdResponseStatus);

    expect(response.body).toEqual<GetUserByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('should return an error if the access token is invalid', async () => {
    const { user } = await createAuthenticatedUser(app);

    const response = await supertest(app).get(`/users/${user.id}`).auth('invalid', { type: 'bearer' });
    expect(response.status).toBe(401 satisfies GetUserByIdResponseStatus);

    expect(response.body).toEqual<GetUserByIdUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
