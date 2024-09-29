import database from '@/database/client';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  WorkspaceCreationBadRequestResponseBody,
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceCreationUnauthorizedResponseBody,
} from '../types';
import { WorkspaceCreationInput } from '../validators';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspaces: Create', async () => {
  const app = await createApp();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates a workspace', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const input: WorkspaceCreationInput = {
      name: 'Workspace',
    };

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send(input);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    expect(workspace).toEqual<WorkspaceCreationSuccessResponseBody>({
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
    const { cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send(
        // @ts-expect-error
        {} satisfies WorkspaceCreationInput,
      );

    expect(workspaceCreationResponse.status).toBe(400 satisfies WorkspaceCreationResponseStatus);
    expect(workspaceCreationResponse.body).toEqual<WorkspaceCreationBadRequestResponseBody>({
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
    const workspaceCreationResponse = await supertest(app).post('/workspaces' satisfies WorkspacePath);

    expect(workspaceCreationResponse.status).toBe(401 satisfies WorkspaceCreationResponseStatus);
    expect(workspaceCreationResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(workspaceCreationResponse.status).toBe(401 satisfies WorkspaceCreationResponseStatus);
    expect(workspaceCreationResponse.body).toEqual<WorkspaceCreationUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
