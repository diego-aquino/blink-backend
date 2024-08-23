import { clearDatabase } from '@tests/utils/database';
import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import createApp from '@/server/app';
import {
  CreateUserConflictResponseBody,
  CreateUserRequestBody,
  CreateUserResponseStatus,
  CreateUserSuccessResponseBody,
  UserResponse,
} from '../types';
import database from '@/database/client';
import { UserPath } from '../router';

describe('Users: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should support creating a user', async () => {
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
    expect(userInDatabase.hashedPassword).not.toBe(input.password);
  });

  it('should not allow creating a user with email already in use', async () => {
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
});
