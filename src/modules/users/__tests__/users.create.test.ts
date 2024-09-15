import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';

import createApp from '@/server/app';
import database from '@/database/client';
import { clearDatabase } from '@tests/utils/database';

import { UserPath } from '../router';
import {
  UserCreationBadRequestResponseBody,
  UserCreationConflictResponseBody,
  UserCreationRequestBody,
  UserCreationResponseStatus,
  UserCreationSuccessResponseBody,
} from '../types';
import { UserCreationInput } from '../validators';
import WorkspaceService from '@/modules/workspaces/WorkspaceService';
import { WorkspaceMemberType } from '@prisma/client';

describe('Users: Create', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a user with a default workspace', async () => {
    const input: UserCreationRequestBody = {
      name: 'User',
      email: 'user@email.com',
      password: 'password',
    };

    const userCreationResponse = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(userCreationResponse.status).toBe(201 satisfies UserCreationResponseStatus);

    const user = userCreationResponse.body as UserCreationSuccessResponseBody;

    expect(user).toEqual<UserCreationSuccessResponseBody>({
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

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    const members = await database.client.workspaceMember.findMany({
      where: { workspaceId: defaultWorkspace.id },
    });

    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(user.id);
    expect(members[0].type).toBe('ADMINISTRATOR' satisfies WorkspaceMemberType);
  });

  it('returns an error if trying to create a user with email already in use', async () => {
    const input: UserCreationRequestBody = {
      name: 'User',
      email: 'user@email.com',
      password: 'password',
    };

    let userCreationResponse = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(userCreationResponse.status).toBe(201 satisfies UserCreationResponseStatus);

    userCreationResponse = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(input);

    expect(userCreationResponse.status).toBe(409 satisfies UserCreationResponseStatus);
    expect(userCreationResponse.body).toEqual<UserCreationConflictResponseBody>({
      code: 'CONFLICT',
      message: "Email 'user@email.com' is already in use.",
    });

    const usersInDatabase = await database.client.user.findMany({
      where: { email: input.email },
    });
    expect(usersInDatabase).toHaveLength(1);
  });

  it('returns an error if trying to create a user with invalid inputs', async () => {
    const userCreationResponse = await supertest(app)
      .post('/users' satisfies UserPath)
      .send(
        // @ts-expect-error
        {} satisfies UserCreationInput,
      );

    expect(userCreationResponse.status).toBe(400 satisfies UserCreationResponseStatus);
    expect(userCreationResponse.body).toEqual<UserCreationBadRequestResponseBody>({
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
