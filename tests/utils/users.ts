import { Express } from 'express';

import { CreateUserRequestBody, CreateUserResponseStatus, CreateUserSuccessResponseBody } from '@/modules/users/types';
import supertest from 'supertest';
import { expect } from 'vitest';
import { LoginResponseStatus, LoginSuccessResponseBody } from '@/modules/auth/types';
import { createId } from '@paralleldrive/cuid2';

export async function createAuthenticatedUser(app: Express, partialInput: Partial<CreateUserRequestBody> = {}) {
  const creationInput: CreateUserRequestBody = {
    name: 'User',
    email: `user-${createId()}@email.com`,
    password: 'password',
    ...partialInput,
  };

  const creationResponse = await supertest(app).post('/users').send(creationInput);
  expect(creationResponse.status).toBe(201 satisfies CreateUserResponseStatus);

  const user = creationResponse.body as CreateUserSuccessResponseBody;

  const loginResponse = await supertest(app).post('/auth/login').send({
    email: creationInput.email,
    password: creationInput.password,
  });

  expect(loginResponse.status).toBe(200 satisfies LoginResponseStatus);

  const loginResult = loginResponse.body as LoginSuccessResponseBody;

  return {
    user,
    auth: loginResult,
    password: creationInput.password,
  };
}
