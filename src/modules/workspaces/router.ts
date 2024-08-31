import { Router } from 'express';

import WorkspaceController from './WorkspaceController';
import AuthMiddleware from '../auth/AuthMiddleware';
import { HttpSchemaPath } from 'zimic/http';
import { BlinkSchema } from '@/types/generated';
import WorkspaceMemberMiddleware from './members/WorkspaceMemberMiddleware';

const workspaceRouter = Router();

const workspaceController = WorkspaceController.instance();

const authMiddleware = AuthMiddleware.instance();
const workspaceMemberMiddleware = WorkspaceMemberMiddleware.instance();

export type WorkspacePath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/workspaces${string}`>;

export namespace WorkspacePath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/workspaces${string}`>;
}

workspaceRouter.post('/workspaces' satisfies WorkspacePath, authMiddleware.authenticated, workspaceController.create);

workspaceRouter.get(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceController.get,
);

workspaceRouter.patch(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('ADMINISTRATOR'),
  workspaceController.update,
);

workspaceRouter.delete(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.minimumType('ADMINISTRATOR'),
  workspaceController.delete,
);

export default workspaceRouter;
