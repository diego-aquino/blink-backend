-- DropForeignKey
ALTER TABLE "Blink"
DROP CONSTRAINT "Blink_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember"
DROP CONSTRAINT "WorkspaceMember_workspaceId_fkey";

-- AlterTable
ALTER TABLE "Workspace"
ADD COLUMN "creatorId" TEXT;

-- AlterTable
ALTER TABLE "WorkspaceMember"
ADD COLUMN "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "Workspace"
ADD CONSTRAINT "Workspace_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember"
ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember"
ADD CONSTRAINT "WorkspaceMember_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blink"
ADD CONSTRAINT "Blink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
