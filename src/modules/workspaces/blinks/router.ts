import { Router } from 'express';
import { HttpSchemaPath } from 'zimic/http';

import { BlinkSchema } from '@/types/generated';
import AuthMiddleware from '@/modules/auth/AuthMiddleware';

import BlinkController from './BlinkController';
import WorkspaceMemberMiddleware from '../members/WorkspaceMemberMiddleware';
import BlinkMiddleware from './BlinkMiddleware';

const blinkRouter = Router();

const blinkController = BlinkController.instance();

const authMiddleware = AuthMiddleware.instance();
const workspaceMemberMiddleware = WorkspaceMemberMiddleware.instance();
const blinkMiddleware = BlinkMiddleware.instance();

export namespace BlinkPath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/workspaces/${string}/blinks${string}`>;
}
export type BlinkPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/workspaces/${string}/blinks${string}`>;

blinkRouter.post(
  '/workspaces/:workspaceId/blinks' satisfies BlinkPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  blinkController.create,
);

blinkRouter.get(
  '/workspaces/:workspaceId/blinks' satisfies BlinkPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  blinkController.list,
);

blinkRouter.get(
  '/workspaces/:workspaceId/blinks/:blinkId' satisfies BlinkPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  blinkController.get,
);

blinkRouter.patch(
  '/workspaces/:workspaceId/blinks/:blinkId' satisfies BlinkPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  blinkMiddleware.blinkWriter,
  blinkController.update,
);

blinkRouter.delete(
  '/workspaces/:workspaceId/blinks/:blinkId' satisfies BlinkPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  blinkMiddleware.blinkWriter,
  blinkController.delete,
);

export default blinkRouter;
