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
} from '../types';

describe('Users: Update', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it("should support updating a user's name", async () => {
    const { user, auth, password } = await createAuthenticatedUser(app);

    const updateInput = {
      name: 'User (updated)',
    } satisfies UpdateUserRequestBody;

    expect(updateInput.name).not.toBe(user.name);

    const response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);
    expect(response.status).toBe(200 satisfies UpdateUserResponseStatus);

    const updatedUser = response.body as UpdateUserSuccessResponseBody;

    expect(updatedUser).toEqual<UpdateUserSuccessResponseBody>({
      ...user,
      name: updateInput.name,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(new Date(user.updatedAt).getTime());

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(updatedUser.name);
    expect(userInDatabase.email).toBe(user.email);
    expect(userInDatabase.hashedPassword).not.toBe(password);
    expect(userInDatabase.createdAt).toEqual(new Date(user.createdAt));
    expect(userInDatabase.updatedAt).toEqual(new Date(updatedUser.updatedAt));
  });

  it("should support updating a user's email", async () => {
    const { user, auth, password } = await createAuthenticatedUser(app);

    const updateInput = {
      email: `user-${createId()}@email.com`,
    } satisfies UpdateUserRequestBody;

    expect(updateInput.email).not.toBe(user.email);

    const response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(response.status).toBe(200 satisfies UpdateUserResponseStatus);

    const updatedUser = response.body as UpdateUserSuccessResponseBody;

    expect(updatedUser).toEqual<UpdateUserSuccessResponseBody>({
      ...user,
      email: updateInput.email,
      updatedAt: expect.any(String),
    });

    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(new Date(user.updatedAt).getTime());

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(user.name);
    expect(userInDatabase.email).toBe(updatedUser.email);
    expect(userInDatabase.hashedPassword).not.toBe(password);
    expect(userInDatabase.createdAt).toEqual(new Date(user.createdAt));
    expect(userInDatabase.updatedAt).toEqual(new Date(updatedUser.updatedAt));
  });

  it('should allow updating a user with same data', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const updateInput = {
      name: user.name,
      email: user.email,
    } satisfies UpdateUserRequestBody;

    const response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);
    expect(response.status).toBe(200 satisfies UpdateUserResponseStatus);

    const updatedUser = response.body as UpdateUserSuccessResponseBody;

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
    expect(userInDatabase.createdAt).toEqual(new Date(user.createdAt));
    expect(userInDatabase.updatedAt).toEqual(new Date(updatedUser.updatedAt));
  });

  it('should not allow updating a user with email already in use', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser } = await createAuthenticatedUser(app);

    const updateInput = {
      email: otherUser.email,
    } satisfies UpdateUserRequestBody;

    expect(updateInput.email).not.toBe(user.email);

    const response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);

    expect(response.status).toBe(409 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserForbiddenResponseBody>({
      code: 'CONFLICT',
      message: `Email '${updateInput.email}' is already in use.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.email).toBe(user.email);
  });

  it('should return an error if the user does not exist', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    await database.client.user.delete({
      where: { id: user.id },
    });

    const response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send({ name: 'User (updated)' } satisfies UpdateUserRequestBody);
    expect(response.status).toBe(404 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserNotFoundResponseBody>({
      code: 'NOT_FOUND',
      message: `User '${user.id}' not found.`,
    });
  });

  it('should return an error if updating a user different than authenticated', async () => {
    const { user, auth } = await createAuthenticatedUser(app);
    const { user: otherUser, auth: otherAuth } = await createAuthenticatedUser(app);

    const updateInput = {
      name: 'User (updated)',
    } satisfies UpdateUserRequestBody;

    expect(updateInput.name).not.toBe(user.name);
    expect(updateInput.name).not.toBe(otherUser.name);

    let response = await supertest(app)
      .patch(`/users/${otherUser.id}` satisfies UserPath.NonLiteral)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(updateInput);
    expect(response.status).toBe(403 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${otherUser.id}'.`,
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.name).toBe(user.name);

    response = await supertest(app)
      .patch(`/users/${user.id}` satisfies UserPath.NonLiteral)
      .auth(otherAuth.accessToken, { type: 'bearer' })
      .send(updateInput);
    expect(response.status).toBe(403 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserForbiddenResponseBody>({
      code: 'FORBIDDEN',
      message: `Access not allowed to resource '/users/${user.id}'.`,
    });

    const otherUserInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: otherUser.id },
    });
    expect(otherUserInDatabase.name).toBe(otherUser.name);
  });

  it('should return an error if not authenticated', async () => {
    const { user } = await createAuthenticatedUser(app);

    const response = await supertest(app).get(`/users/${user.id}` satisfies UserPath.NonLiteral);
    expect(response.status).toBe(401 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('should return an error if the access token is invalid', async () => {
    const response = await supertest(app).post('/auth/logout').auth('invalid', { type: 'bearer' });
    expect(response.status).toBe(401 satisfies UpdateUserResponseStatus);

    expect(response.body).toEqual<UpdateUserUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
