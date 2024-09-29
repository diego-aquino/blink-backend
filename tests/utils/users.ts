import { Express } from 'express';

import {
  UserCreationRequestBody,
  UserCreationResponseStatus,
  UserCreationSuccessResponseBody,
} from '@/modules/users/types';
import supertest from 'supertest';
import { expect } from 'vitest';
import { LoginResponseStatus } from '@/modules/auth/types';
import { createId } from '@paralleldrive/cuid2';
import { readCookie } from '@/utils/cookies';
import { REFRESH_COOKIE_NAME } from '@/modules/auth/constants';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

export async function createAuthenticatedUser(app: Express, partialInput: Partial<UserCreationRequestBody> = {}) {
  const creationInput: UserCreationRequestBody = {
    name: 'User',
    email: `user-${createId()}@email.com`,
    password: 'password',
    ...partialInput,
  };

  const creationResponse = await supertest(app).post('/users').send(creationInput);
  expect(creationResponse.status).toBe(201 satisfies UserCreationResponseStatus);

  const user = creationResponse.body as UserCreationSuccessResponseBody;

  const loginResponse = await supertest(app).post('/auth/login').send({
    email: creationInput.email,
    password: creationInput.password,
  });

  expect(loginResponse.status).toBe(204 satisfies LoginResponseStatus);

  const cookies = loginResponse.get('Set-Cookie') ?? [];

  const accessCookie = readCookie(ACCESS_COOKIE_NAME, cookies)!;
  expect(accessCookie).toBeDefined();

  const refreshCookie = readCookie(REFRESH_COOKIE_NAME, cookies)!;
  expect(refreshCookie).toBeDefined();

  return {
    user,
    cookies: {
      all: cookies,
      access: accessCookie,
      refresh: refreshCookie,
    },
    auth: {
      accessToken: accessCookie.value,
      refreshToken: refreshCookie.value,
      password: creationInput.password,
    },
  };
}
