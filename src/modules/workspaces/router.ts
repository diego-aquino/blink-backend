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

export namespace WorkspacePath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/workspaces${string}`>;
}
export type WorkspacePath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/workspaces${string}`>;

workspaceRouter.post('/workspaces' satisfies WorkspacePath, authMiddleware.authenticated, workspaceController.create);

workspaceRouter.get(
  '/workspaces' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceController.listAsMember,
);

workspaceRouter.get(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('DEFAULT'),
  workspaceController.get,
);

workspaceRouter.patch(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('ADMINISTRATOR'),
  workspaceController.update,
);

workspaceRouter.delete(
  '/workspaces/:workspaceId' satisfies WorkspacePath,
  authMiddleware.authenticated,
  workspaceMemberMiddleware.memberTypeAtLeast('ADMINISTRATOR'),
  workspaceController.delete,
);

export default workspaceRouter;
