import { User, Blink } from '@prisma/client';
import { BlinkResponse } from './types';
import { toUserResponse } from '@/modules/users/views';

export function toBlinkResponse(blink: Blink & { creator: User | null }): BlinkResponse {
  return {
    id: blink.id,
    name: blink.name,
    url: blink.url,
    redirectId: blink.redirectId,
    creator: blink.creator ? toUserResponse(blink.creator) : undefined,
    createdAt: blink.createdAt.toISOString(),
    updatedAt: blink.updatedAt.toISOString(),
  };
}
