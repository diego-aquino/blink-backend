import { clearDatabase } from '@tests/utils/database';
import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import createApp from '@/server/app';
import { BlinkOperations } from '@/types/generated';
import { CreateUserConflictResponseBody, UserResponse } from '../types';
import database from '@/database/client';

describe('Users', async () => {
  type CreateUserRequestBody = BlinkOperations['users/create']['request']['body'];
  type CreateUserResponseStatus = keyof BlinkOperations['users/create']['response'];
  type CreateUserSuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];

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

    const response = await supertest(app).post('/users').send(input);
    expect(response.status).toBe(201 satisfies CreateUserResponseStatus);

    const user = response.body as UserResponse;

    expect(user).toEqual({
      id: expect.any(String),
      name: input.name,
      email: input.email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    } satisfies CreateUserSuccessResponseBody);

    const userInDatabase = await database.user.findUniqueOrThrow({
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

    let response = await supertest(app).post('/users').send(input);
    expect(response.status).toBe(201 satisfies CreateUserResponseStatus);

    response = await supertest(app).post('/users').send(input);
    expect(response.status).toBe(409 satisfies CreateUserResponseStatus);

    expect(response.body).toEqual({
      code: 'CONFLICT',
      message: "Email 'user@email.com' is already in use.",
    } satisfies CreateUserConflictResponseBody);

    const usersInDatabase = await database.user.findMany({
      where: { email: input.email },
    });
    expect(usersInDatabase).toHaveLength(1);
  });
});
