import { BlinkPath } from '@/modules/workspaces/blinks/router';
import {
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
  BlinkCreationBadRequestResponseBody,
  BlinkGetByIdResponseStatus,
} from '@/modules/workspaces/blinks/types';
import { BlinkCreationInput } from '@/modules/workspaces/blinks/validators';
import WorkspaceService from '@/modules/workspaces/WorkspaceService';
import createApp from '@/server/app';
import { clearDatabase } from '@tests/utils/database';
import { createAuthenticatedUser } from '@tests/utils/users';
import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { REDIRECT_CACHE_CONTROL, REDIRECT_STATUS_CODE } from '../RedirectController';
import { REDIRECT_HTTP_METHODS, RedirectPath } from '../router';

import { httpInterceptor } from 'zimic/interceptor/http';
import { HttpHeaders, HttpSchema, HttpSearchParams } from 'zimic/http';

describe('Redirects', async () => {
  const app = await createApp();

  type ExampleHeaders = HttpSchema.Headers<{
    'x-custom': string;
  }>;

  type ExampleSearchParams = HttpSchema.SearchParams<{
    custom: string;
  }>;

  type Schema = HttpSchema<{
    '/example': {
      GET: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
      POST: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
      PUT: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
      PATCH: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
      DELETE: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
      HEAD: {
        request: { headers: ExampleHeaders; searchParams: ExampleSearchParams };
        response: { 200: {} };
      };
    };
  }>;

  const interceptor = httpInterceptor.create<Schema>({
    type: 'local',
    baseURL: 'http://localhost:3001',
    saveRequests: true,
  });

  const blinkURL = `${interceptor.baseURL()}/example`;

  const workspaceService = WorkspaceService.instance();

  beforeAll(async () => {
    await interceptor.start();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(() => {
    interceptor.clear();
  });

  afterAll(async () => {
    await interceptor.stop();
  });

  describe.each(REDIRECT_HTTP_METHODS)('Method: %s', (method) => {
    const lowerCaseMethod = method.toLowerCase() as Lowercase<typeof method>;

    it('should support redirecting requests having a registered blink', async () => {
      const { user, cookies } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .set('cookie', cookies.access.raw)
        .send({
          name: 'Blink',
          url: blinkURL,
        } satisfies BlinkCreationInput.Body);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      let redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .redirects(0);

      expect(redirectResponse.status).toBe(REDIRECT_STATUS_CODE);
      expect(redirectResponse.headers['cache-control']).toBe(REDIRECT_CACHE_CONTROL);
      expect(redirectResponse.headers.location).toBe(blinkURL);

      const exampleHandler = interceptor[lowerCaseMethod]('/example').respond({ status: 200 });

      redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .redirects(1);

      expect(redirectResponse.status).toBe(200);

      const exampleRequests = exampleHandler.requests();
      expect(exampleRequests).toHaveLength(1);
    });

    it('should forward headers on redirect', async () => {
      const { user, cookies } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .set('cookie', cookies.access.raw)
        .send({
          name: 'Blink',
          url: blinkURL,
        } satisfies BlinkCreationInput.Body);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      const headers = new HttpHeaders<ExampleHeaders>({
        'x-custom': 'value',
      });

      let redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .set('x-custom' satisfies keyof ExampleHeaders, headers.get('x-custom'))
        .redirects(0);

      expect(redirectResponse.status).toBe(REDIRECT_STATUS_CODE);
      expect(redirectResponse.headers['cache-control']).toBe(REDIRECT_CACHE_CONTROL);
      expect(redirectResponse.headers.location).toBe(blinkURL);

      const exampleHandler = interceptor[lowerCaseMethod]('/example').with({ headers }).respond({ status: 200 });

      redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .set('x-custom' satisfies keyof ExampleHeaders, headers.get('x-custom'))
        .redirects(1);

      expect(redirectResponse.status).toBe(200);

      const exampleRequests = exampleHandler.requests();
      expect(exampleRequests).toHaveLength;
    });

    it('should forward query parameters on redirect', async () => {
      const { user, cookies } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .set('cookie', cookies.access.raw)
        .send({
          name: 'Blink',
          url: blinkURL,
        } satisfies BlinkCreationInput.Body);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      const searchParams = new HttpSearchParams<ExampleSearchParams>({
        custom: 'value',
      });

      let redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .query(Object.fromEntries(searchParams))
        .redirects(0);

      expect(redirectResponse.status).toBe(REDIRECT_STATUS_CODE);
      expect(redirectResponse.headers['cache-control']).toBe(REDIRECT_CACHE_CONTROL);
      expect(redirectResponse.headers.location).toBe(blinkURL + `?${searchParams.toString()}`);

      const exampleHandler = interceptor[lowerCaseMethod]('/example').with({ searchParams }).respond({ status: 200 });

      redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .query(Object.fromEntries(searchParams))
        .redirects(1);

      expect(redirectResponse.status).toBe(200);

      const exampleRequests = exampleHandler.requests();
      expect(exampleRequests).toHaveLength(1);
    });

    it('returns an error if a blink with the redirect id is not found', async () => {
      const { user, cookies } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const redirectResponse = await supertest(app)
        [lowerCaseMethod]('/unknown' satisfies RedirectPath.NonLiteral)
        .set('cookie', cookies.access.raw);

      expect(redirectResponse.status).toBe(404 satisfies BlinkGetByIdResponseStatus);

      expect(redirectResponse.body).toEqual<BlinkCreationBadRequestResponseBody>({
        code: 'NOT_FOUND',
        message: "Blink with redirect 'unknown' not found.",
      });
    });
  });
});
