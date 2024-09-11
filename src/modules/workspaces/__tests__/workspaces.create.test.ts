import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  CreateWorkspaceBadRequestResponseBody,
  CreateWorkspaceResponseStatus,
  CreateWorkspaceSuccessResponseBody,
  CreateWorkspaceUnauthorizedResponseBody,
} from '../types';
import { CreateWorkspaceInput } from '../validators';

describe('Workspaces: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a workspace', async () => {
    const { user, auth } = await createAuthenticatedUser(app);

    const input: CreateWorkspaceInput = {
      name: 'Workspace',
    };

    const response = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(input);

    expect(response.status).toBe(201 satisfies CreateWorkspaceResponseStatus);

    const workspace = response.body as CreateWorkspaceSuccessResponseBody;

    expect(workspace).toEqual<CreateWorkspaceSuccessResponseBody>({
      id: expect.any(String),
      name: input.name,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const workspaceInDatabase = await database.client.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });
    expect(workspaceInDatabase.id).toBe(workspace.id);
    expect(workspaceInDatabase.name).toBe(workspace.name);
    expect(workspaceInDatabase.creatorId).toBe(user.id);
    expect(workspaceInDatabase.createdAt.toISOString()).toEqual(workspace.createdAt);
    expect(workspaceInDatabase.updatedAt.toISOString()).toEqual(workspace.updatedAt);
  });

  it('returns an error if trying to create a workspace with invalid inputs', async () => {
    const { auth } = await createAuthenticatedUser(app);

    const response = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth(auth.accessToken, { type: 'bearer' })
      .send(
        // @ts-expect-error
        {} satisfies CreateWorkspaceInput,
      );

    expect(response.status).toBe(400 satisfies CreateWorkspaceResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceBadRequestResponseBody>({
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
      ],
    });
  });

  it('returns an error if not authenticated', async () => {
    const response = await supertest(app).post('/workspaces' satisfies WorkspacePath);

    expect(response.status).toBe(401 satisfies CreateWorkspaceResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const response = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .auth('invalid', { type: 'bearer' });

    expect(response.status).toBe(401 satisfies CreateWorkspaceResponseStatus);
    expect(response.body).toEqual<CreateWorkspaceUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
