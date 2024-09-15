import { createId } from '@paralleldrive/cuid2';
import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import database from '@/database/client';
import { clearDatabase } from '@tests/utils/database';

import { UserPath } from '../router';
import {
  UserUpdateForbiddenResponseBody,
  UserUpdateNotFoundResponseBody,
  UserUpdateSuccessResponseBody,
  UserUpdateUnauthorizedResponseBody,
  UserUpdateRequestBody,
  UserUpdateResponseStatus,
  UserUpdateBadRequestResponseBody,
} from '../types';

describe('Users: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates a user as oneself', async () => {
    const { user, auth, password } = await createAuthenticatedUser(app);

    const updateInput = {
      name: 'User (updated)',
      email: `user-${createId()}-updated@email.com`,
    } satisfies UserUpdateRequestBody;

    expect(updateInput.name).not.toBe(user.name);
    expect(updateInput.email).not.toBe(user.email);

    const userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(userUpdateResponse.status).toBe(200 satisfies UserUpdateResponseStatus);

    const updatedUser = userUpdateResponse.body as UserUpdateSuccessResponseBody;

    expect(updatedUser).toEqual<UserUpdateSuccessResponseBody>({
      ...user,
      name: updateInput.name,
      email: updateInput.email,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(new Date(user.updatedAt).getTime());

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(updatedUser.name);
    expect(userInDatabase.email).toBe(updatedUser.email);
    expect(userInDatabase.hashedPassword).not.toBe(password);
    expect(userInDatabase.createdAt.toISOString()).toEqual(user.createdAt);
    expect(userInDatabase.updatedAt.toISOString()).toEqual(updatedUser.updatedAt);
  });

  it('updates a user with unchanged inputs', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const updateInput = {
      name: user.name,
      email: user.email,
    } satisfies UserUpdateRequestBody;

    const userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(userUpdateResponse.status).toBe(200 satisfies UserUpdateResponseStatus);

    const updatedUser = userUpdateResponse.body as UserUpdateSuccessResponseBody;

    expect(updatedUser).toEqual<UserUpdateSuccessResponseBody>({
      ...user,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(new Date(user.updatedAt).getTime());

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(user.name);
    expect(userInDatabase.email).toBe(user.email);
    expect(userInDatabase.createdAt.toISOString()).toEqual(user.createdAt);
    expect(userInDatabase.updatedAt.toISOString()).toEqual(updatedUser.updatedAt);
  });

  it('returns an error if trying to update a user with email already in use', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser } = await createAuthenticatedUser(app);

    const updateInput = {
      email: otherUser.email,
    } satisfies UserUpdateRequestBody;

    expect(updateInput.email).not.toBe(user.email);

    const userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(userUpdateResponse.status).toBe(409 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateForbiddenResponseBody>({
      code: 'CONFLICT',
      message: `Email '${updateInput.email}' is already in use.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.email).toBe(user.email);
  });

  it('returns an error if trying to update a user with invalid inputs', async () => {
    const { user, auth, password } = await createAuthenticatedUser(app);

    const userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(
        // @ts-expect-error
        { name: 1 } satisfies UserUpdateRequestBody,
      );

    expect(userUpdateResponse.status).toBe(400 satisfies UserUpdateResponseStatus);

    expect(userUpdateResponse.body).toEqual<UserUpdateBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ],
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(user.name);
    expect(userInDatabase.email).toBe(user.email);
    expect(userInDatabase.hashedPassword).not.toBe(password);
    expect(userInDatabase.createdAt.toISOString()).toEqual(user.createdAt);
    expect(userInDatabase.updatedAt.toISOString()).toEqual(user.updatedAt);
  });

  it('returns an error if the user does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'User (updated)' } satisfies UserUpdateRequestBody);

    expect(userUpdateResponse.status).toBe(404 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('returns an error if trying to update a user as a different user', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const updateInput = {
      name: 'User (updated)',
    } satisfies UserUpdateRequestBody;

    expect(updateInput.name).not.toBe(user.name);
    expect(updateInput.name).not.toBe(otherUser.name);

    let userUpdateResponse = await supertest(app)
      .patch(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(userUpdateResponse.status).toBe(403 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${otherUser.id}'.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.name).toBe(user.name);

    userUpdateResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(userUpdateResponse.status).toBe(403 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${user.id}'.`,
    });

    const otherUserInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: otherUser.id },
    });
    expect(otherUserInDatabase.name).toBe(otherUser.name);
  });

  it('returns an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const userUpdateResponse = await supertest(app).get(`/users/${user.id}` satisfies UserPath.NonLiteral);

    expect(userUpdateResponse.status).toBe(401 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const userUpdateResponse = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });

    expect(userUpdateResponse.status).toBe(401 satisfies UserUpdateResponseStatus);
    expect(userUpdateResponse.body).toEqual<UserUpdateUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
