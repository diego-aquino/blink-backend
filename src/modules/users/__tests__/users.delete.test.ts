import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import { clearDatabase } from '@tests/utils/database';
import database from '@/database/client';

import { UserPath } from '../router';
import { DeleteUserNotFoundResponseBody, DeleteUserResponseStatus, DeleteUserUnauthorizedResponseBody } from '../types';

describe('Users: Delete', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should support deleting a user', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(204 satisfies DeleteUserResponseStatus);

    const userInDatabase = await database.client.user.findUnique({
      where: { id: user.id },
    });
    expect(userInDatabase).toBe(null);
  });

  it('should return an error if the user does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const response = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(404 satisfies DeleteUserResponseStatus);

    expect(response.body).toEqual<DeleteUserNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('should return an error if deleting a user different than authenticated', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    let response = await supertest(app)
      .delete(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(403 satisfies DeleteUserResponseStatus);

    expect(response.body).toEqual<DeleteUserNotFoundResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${otherUser.id}'.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);

    response = await supertest(app)
      .delete(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' });
    expect(response.status).toBe(403 satisfies DeleteUserResponseStatus);

    expect(response.body).toEqual<DeleteUserNotFoundResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${user.id}'.`,
    });

    const otherUserInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: otherUser.id },
    });
    expect(otherUserInDatabase.id).toBe(otherUser.id);
  });

  it('should return an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const response = await supertest(app).delete(`/users/${user.id}` satisfies UserPath.NonLiteral);
    expect(response.status).toBe(401 satisfies DeleteUserResponseStatus);

    expect(response.body).toEqual<DeleteUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('should return an error if the access token is invalid', async () => {
    const response = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies DeleteUserResponseStatus);

    expect(response.body).toEqual<DeleteUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
