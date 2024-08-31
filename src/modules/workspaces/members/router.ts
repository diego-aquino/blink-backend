import { Router } from 'express';
import { HttpSchemaPath } from 'zimic/http';

import { BlinkSchema } from '@/types/generated';
import AuthMiddleware from '@/modules/auth/AuthMiddleware';

import WorkspaceMemberController from './WorkspaceMemberController';
import WorkspaceMemberMiddleware from './WorkspaceMemberMiddleware';

const workspaceMemberRouter = Router();

const workspaceMemberController = WorkspaceMemberController.instance();

const authMiddleware = AuthMiddleware.instance();
const workspaceMemberMiddleware = WorkspaceMemberMiddleware.instance();

export type WorkspaceMemberPath = Extract<
  HttpSchemaPath.Literal<BlinkSchema>,
  `/workspaces/:workspaceId/members${string}`
>;

export namespace WorkspaceMemberPath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/workspaces/:workspaceId/members${string}`>;
}

workspaceMemberRouter.post(
  '/workspaces/:workspaceId/members' satisfies WorkspaceMemberPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('ADMINISTRATOR'),
  workspaceMemberController.create,
);

workspaceMemberRouter.get(
  '/workspaces/:workspaceId/members/:memberId' satisfies WorkspaceMemberPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('DEFAULT'),
  workspaceMemberController.get,
);

workspaceMemberRouter.patch(
  '/workspaces/:workspaceId/members/:memberId' satisfies WorkspaceMemberPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('ADMINISTRATOR'),
  workspaceMemberController.update,
);

workspaceMemberRouter.delete(
  '/workspaces/:workspaceId/members/:memberId' satisfies WorkspaceMemberPath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('ADMINISTRATOR'),
  workspaceMemberController.delete,
);

export default workspaceMemberRouter;
