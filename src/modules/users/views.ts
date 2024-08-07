import { BlinkComponents } from '@/types/generated';
import { User } from '@prisma/client';

export function toUserResponse(user: User): BlinkComponents['schemas']['User'] {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
