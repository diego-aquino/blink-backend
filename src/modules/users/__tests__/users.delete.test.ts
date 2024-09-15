import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { clearDatabase } from '@tests/utils/database';
import database from '@/database/client';

import { UserPath } from '../router';
import {
  UserDeletionNotFoundResponseBody,
  UserDeletionResponseStatus,
  UserDeletionUnauthorizedResponseBody,
} from '../types';

describe('Users: Delete', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes a user', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const userDeletionResponse = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(userDeletionResponse.status).toBe(204 satisfies UserDeletionResponseStatus);

    const userInDatabase = await database.client.user.findUnique({
      where: { id: user.id },
    });
    expect(userInDatabase).toBe(null);
  });

  it('returns an error if the user does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const userDeletionResponse = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(userDeletionResponse.status).toBe(404 satisfies UserDeletionResponseStatus);
    expect(userDeletionResponse.body).toEqual<UserDeletionNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('returns an error if trying to delete a user as a different user', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    let userDeletionResponse = await supertest(app)
      .delete(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });

    expect(userDeletionResponse.status).toBe(403 satisfies UserDeletionResponseStatus);
    expect(userDeletionResponse.body).toEqual<UserDeletionNotFoundResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${otherUser.id}'.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);

    userDeletionResponse = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });

    expect(userDeletionResponse.status).toBe(403 satisfies UserDeletionResponseStatus);
    expect(userDeletionResponse.body).toEqual<UserDeletionNotFoundResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${user.id}'.`,
    });

    const otherUserInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: otherUser.id },
    });
    expect(otherUserInDatabase.id).toBe(otherUser.id);
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const userDeletionResponse = await supertest(app).delete(`/users/${user.id}` satisfies UserPath.NonLiteral);

    expect(userDeletionResponse.status).toBe(401 satisfies UserDeletionResponseStatus);
    expect(userDeletionResponse.body).toEqual<UserDeletionUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const userDeletionResponse = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });

    expect(userDeletionResponse.status).toBe(401 satisfies UserDeletionResponseStatus);
    expect(userDeletionResponse.body).toEqual<UserDeletionUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
