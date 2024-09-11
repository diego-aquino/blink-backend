import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import database from '@/database/client';
import { clearDatabase } from '@tests/utils/database';

import { UserPath } from '../router';
import {
  CreateUserBadRequestResponseBody,
  CreateUserConflictResponseBody,
  CreateUserRequestBody,
  CreateUserResponseStatus,
  CreateUserSuccessResponseBody,
} from '../types';
import { CreateUserInput } from '../validators';

describe('Users: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a user with a default workspace', async () => {
    const input: CreateUserRequestBody = {
      name: 'User',
      email: 'user@email.com',
      password: 'password',
    };

    const response = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(response.status).toBe(201 satisfies CreateUserResponseStatus);

    const user = response.body as CreateUserSuccessResponseBody;

    expect(user).toEqual<CreateUserSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      email: input.email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const userInDatabase = await database.client.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(userInDatabase.id).toBe(user.id);
    expect(userInDatabase.name).toBe(user.name);
    expect(userInDatabase.email).toBe(user.email);
    expect(userInDatabase.hashedPassword).not.toBe(input.password);
    expect(userInDatabase.createdAt.toISOString()).toEqual(user.createdAt);
    expect(userInDatabase.updatedAt.toISOString()).toEqual(user.updatedAt);
  });

  it('returns an error if trying to create a user with email already in use', async () => {
    const input: CreateUserRequestBody = {
      name: 'User',
      email: 'user@email.com',
      password: 'password',
    };

    let response = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(response.status).toBe(201 satisfies CreateUserResponseStatus);

    response = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(response.status).toBe(409 satisfies CreateUserResponseStatus);
    expect(response.body).toEqual<CreateUserConflictResponseBody>({
      code: 'CONFLICT',
      message: "Email 'user@email.com' is already in use.",
    });

    const usersInDatabase = await database.client.user.findMany({
      where: { email: input.email },
    });
    expect(usersInDatabase).toHaveLength(1);
  });

  it('returns an error if trying to create a user with invalid inputs', async () => {
    const response = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(
        // @ts-expect-error
        {} satisfies CreateUserInput,
      );

    expect(response.status).toBe(400 satisfies CreateUserResponseStatus);
    expect(response.body).toEqual<CreateUserBadRequestResponseBody>({
      message: 'Validation failed',
      code: 'BAD_REQUEST',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['email'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['password'],
          message: 'Required',
        },
      ],
    });
  });
});
