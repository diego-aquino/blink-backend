import { createId } from '@paralleldrive/cuid2';
import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import { createAuthenticatedUser } from '@tests/utils/users';
import database from '@/database/client';
import { clearDatabase } from '@tests/utils/database';

import { UserPath } from '../router';
import {
  UpdateUserForbiddenResponseBody,
  UpdateUserNotFoundResponseBody,
  UpdateUserSuccessResponseBody,
  UpdateUserUnauthorizedResponseBody,
  UpdateUserRequestBody,
  UpdateUserResponseStatus,
  UpdateUserBadRequestResponseBody,
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
    } satisfies UpdateUserRequestBody;

    expect(updateInput.name).not.toBe(user.name);
    expect(updateInput.email).not.toBe(user.email);

    const updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateUserResponse.status).toBe(200 satisfies UpdateUserResponseStatus);

    const updatedUser = updateUserResponse.body as UpdateUserSuccessResponseBody;

    expect(updatedUser).toEqual<UpdateUserSuccessResponseBody>({
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
    } satisfies UpdateUserRequestBody;

    const updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateUserResponse.status).toBe(200 satisfies UpdateUserResponseStatus);

    const updatedUser = updateUserResponse.body as UpdateUserSuccessResponseBody;

    expect(updatedUser).toEqual<UpdateUserSuccessResponseBody>({
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
    } satisfies UpdateUserRequestBody;

    expect(updateInput.email).not.toBe(user.email);

    const updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateUserResponse.status).toBe(409 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserForbiddenResponseBody>({
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

    const updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(
        // @ts-expect-error
        { name: 1 } satisfies UpdateUserRequestBody,
      );

    expect(updateUserResponse.status).toBe(400 satisfies UpdateUserResponseStatus);

    expect(updateUserResponse.body).toEqual<UpdateUserBadRequestResponseBody>({
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

    const updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'User (updated)' } satisfies UpdateUserRequestBody);

    expect(updateUserResponse.status).toBe(404 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('returns an error if trying to update a user as a different user', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const updateInput = {
      name: 'User (updated)',
    } satisfies UpdateUserRequestBody;

    expect(updateInput.name).not.toBe(user.name);
    expect(updateInput.name).not.toBe(otherUser.name);

    let updateUserResponse = await supertest(app)
      .patch(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateUserResponse.status).toBe(403 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Operation not allowed on resource '/users/${otherUser.id}'.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.name).toBe(user.name);

    updateUserResponse = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(updateUserResponse.status).toBe(403 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserForbiddenResponseBody>({
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

    const updateUserResponse = await supertest(app).get(`/users/${user.id}` satisfies UserPath.NonLiteral);

    expect(updateUserResponse.status).toBe(401 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const updateUserResponse = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });

    expect(updateUserResponse.status).toBe(401 satisfies UpdateUserResponseStatus);
    expect(updateUserResponse.body).toEqual<UpdateUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
