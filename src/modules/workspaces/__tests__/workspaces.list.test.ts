import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspacePath } from '../router';
import {
  WorkspaceCreationResponseStatus,
  WorkspaceCreationSuccessResponseBody,
  WorkspaceListResponseStatus,
  WorkspaceListSuccessResponseBody,
  WorkspaceListUnauthorizedResponseBody,
} from '../types';
import { WorkspaceCreationInput, WorkspaceListInput } from '../validators';
import WorkspaceService from '../WorkspaceService';
import { toWorkspaceResponse } from '../views';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants';

describe('Workspaces: List', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  it('lists workspaces as a member with pagination', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    let workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const otherWorkspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    let workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    let { workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(3);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<WorkspaceCreationSuccessResponseBody>(workspace);
    expect(workspaces[2]).toEqual<WorkspaceCreationSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);

    workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .query({ page: 1, limit: 2 } satisfies WorkspaceListInput);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody);

    expect(workspaces).toHaveLength(2);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<WorkspaceCreationSuccessResponseBody>(workspace);

    expect(total).toBe(3);

    workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .query({ page: 2, limit: 2 } satisfies WorkspaceListInput);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);
  });

  it('filters workspaces as a member by case-insensitive name', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    let workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Other Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const otherWorkspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    let workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .query({ name: 'workspace' } satisfies WorkspaceListInput.Raw);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    let { workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(3);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(otherWorkspace);
    expect(workspaces[1]).toEqual<WorkspaceCreationSuccessResponseBody>(workspace);
    expect(workspaces[2]).toEqual<WorkspaceCreationSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(3);

    workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .query({ name: 'other' } satisfies WorkspaceListInput.Raw);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(otherWorkspace);

    expect(total).toBe(1);
  });

  it('does not list workspaces as not a member', async () => {
    const { user, cookies } = await createAuthenticatedUser(app);

    const workspaceCreationResponse = await supertest(app)
      .post('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw)
      .send({ name: 'Workspace' } satisfies WorkspaceCreationInput);

    expect(workspaceCreationResponse.status).toBe(201 satisfies WorkspaceCreationResponseStatus);

    const workspace = workspaceCreationResponse.body as WorkspaceCreationSuccessResponseBody;

    const { user: otherUser, cookies: otherCookies } = await createAuthenticatedUser(app);

    let workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', cookies.access.raw);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    let { workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody;

    const defaultWorkspace = (await workspaceService.getDefaultWorkspace(user.id))!;
    expect(defaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(2);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(workspace);
    expect(workspaces[1]).toEqual<WorkspaceCreationSuccessResponseBody>(toWorkspaceResponse(defaultWorkspace));

    expect(total).toBe(2);

    workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', otherCookies.access.raw);

    expect(workspaceListResponse.status).toBe(200 satisfies WorkspaceListResponseStatus);

    ({ workspaces, total } = workspaceListResponse.body as WorkspaceListSuccessResponseBody);

    const otherDefaultWorkspace = (await workspaceService.getDefaultWorkspace(otherUser.id))!;
    expect(otherDefaultWorkspace).not.toBeNull();

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toEqual<WorkspaceCreationSuccessResponseBody>(toWorkspaceResponse(otherDefaultWorkspace));

    expect(total).toBe(1);
  });

  it('returns an error if not authenticated', async () => {
    const workspaceListResponse = await supertest(app).get('/workspaces' satisfies WorkspacePath);

    expect(workspaceListResponse.status).toBe(401 satisfies WorkspaceListResponseStatus);
    expect(workspaceListResponse.body).toEqual<WorkspaceListUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required to access this resource.',
    });
  });

  it('returns an error if the access token is invalid', async () => {
    const workspaceListResponse = await supertest(app)
      .get('/workspaces' satisfies WorkspacePath)
      .set('cookie', `${ACCESS_COOKIE_NAME}=invalid`);

    expect(workspaceListResponse.status).toBe(401 satisfies WorkspaceListResponseStatus);
    expect(workspaceListResponse.body).toEqual<WorkspaceListUnauthorizedResponseBody>({
      code: 'UNAUTHORIZED',
      message: 'Authentication credentials are not valid.',
    });
  });
});
