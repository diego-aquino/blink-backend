import { Workspace } from '@prisma/client';
import { WorkspaceResponse } from './types';

export function toWorkspaceResponse(workspace: Workspace): WorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}
