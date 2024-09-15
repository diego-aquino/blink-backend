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
import { beforeEach, describe, expect, it } from 'vitest';

import { REDIRECT_CACHE_CONTROL, REDIRECT_STATUS_CODE } from '../RedirectController';
import { REDIRECT_HTTP_METHODS, RedirectPath } from '../router';

describe('Redirects', async () => {
  const app = await createApp();

  const workspaceService = WorkspaceService.instance();

  beforeEach(async () => {
    await clearDatabase();
  });

  describe.each(REDIRECT_HTTP_METHODS)('Method: %s', (method) => {
    const lowerCaseMethod = method.toLowerCase() as Lowercase<typeof method>;

    it('should support redirecting requests having a registered blink', async () => {
      const { user, auth } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .auth(auth.accessToken, { type: 'bearer' })
        .send({
          name: 'Blink',
          url: 'https://example.com',
        } satisfies BlinkCreationInput.Body);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      const redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .redirects(0);

      expect(redirectResponse.status).toBe(REDIRECT_STATUS_CODE);
      expect(redirectResponse.headers['cache-control']).toBe(REDIRECT_CACHE_CONTROL);
      expect(redirectResponse.headers.location).toBe(new URL(blink.url).toString());
    });

    it('should forward query parameters on redirect', async () => {
      const { user, auth } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const blinkCreationResponse = await supertest(app)
        .post(`/workspaces/${workspace.id}/blinks` satisfies BlinkPath.NonLiteral)
        .auth(auth.accessToken, { type: 'bearer' })
        .send({
          name: 'Blink',
          url: 'https://example.com',
        } satisfies BlinkCreationInput.Body);

      expect(blinkCreationResponse.status).toBe(201 satisfies BlinkCreationResponseStatus);

      const blink = blinkCreationResponse.body as BlinkCreationSuccessResponseBody;

      const searchParams = new URLSearchParams({
        query: 'param',
        otherQuery: 'other',
      });

      const redirectResponse = await supertest(app)
        [lowerCaseMethod](`/${blink.redirectId}` satisfies RedirectPath.NonLiteral)
        .query(Object.fromEntries(searchParams))
        .redirects(0);

      expect(redirectResponse.status).toBe(REDIRECT_STATUS_CODE);
      expect(redirectResponse.headers['cache-control']).toBe(REDIRECT_CACHE_CONTROL);
      expect(redirectResponse.headers.location).toBe(new URL(blink.url).toString() + `?${searchParams.toString()}`);
    });

    it('returns an error if a blink with the redirect id is not found', async () => {
      const { user, auth } = await createAuthenticatedUser(app);

      const workspace = (await workspaceService.getDefaultWorkspace(user.id))!;
      expect(workspace).not.toBeNull();

      const redirectResponse = await supertest(app)
        [lowerCaseMethod]('/unknown' satisfies RedirectPath.NonLiteral)
        .auth(auth.accessToken, { type: 'bearer' });

      expect(redirectResponse.status).toBe(404 satisfies BlinkGetByIdResponseStatus);

      const hasBody = method !== 'HEAD';

      expect(redirectResponse.body).toEqual<BlinkCreationBadRequestResponseBody | {}>(
        hasBody
          ? {
              code: 'NOT_FOUND',
              message: "Blink with redirect 'unknown' not found.",
            }
          : {},
      );
    });
  });
});
