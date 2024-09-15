import { createId, init as createIdFactory } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { BlinkByRedirectNotFoundError, BlinkNotFoundError, BlinkRedirectGenerationError } from './errors';
import { BlinkCreationInput, BlinkByIdInput, BlinkUpdateInput, BlinkListInput } from './validators';
import { Prisma, User } from '@prisma/client';

const MAX_BLINK_REDIRECT_ID_GENERATION_RETRIES = 5;

class BlinkService {
  private static _instance = new BlinkService();

  static instance() {
    return this._instance;
  }

  private generateRedirectId = createIdFactory({ length: 8 });

  private constructor() {}

  async create(creatorId: User['id'], input: BlinkCreationInput) {
    const blink = await database.client.blink.create({
      data: {
        id: createId(),
        workspaceId: input.workspaceId,
        name: input.name,
        url: input.url,
        redirectId: input.redirectId ?? (await this.generateUnusedRedirectId()),
        creatorId,
      },
      include: { creator: true },
    });

    return blink;
  }

  private async generateUnusedRedirectId() {
    for (let retry = 0; retry < MAX_BLINK_REDIRECT_ID_GENERATION_RETRIES; retry++) {
      const redirectIdCandidate = this.generateRedirectId();

      const existingBlink = await database.client.blink.findUnique({
        where: { redirectId: redirectIdCandidate },
        select: { id: true },
      });

      if (!existingBlink) {
        return redirectIdCandidate;
      }
    }

    throw new BlinkRedirectGenerationError();
  }

  async list(input: BlinkListInput) {
    const where: Prisma.BlinkWhereInput = {
      name: input.name ? { contains: input.name, mode: 'insensitive' } : undefined,
      workspaceId: input.workspaceId,
    };

    const [blinks, total] = await Promise.all([
      database.client.blink.findMany({
        where,
        include: { creator: true },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      database.client.blink.count({ where }),
    ]);

    return { list: blinks, total };
  }

  async get(input: BlinkByIdInput) {
    const blink = await database.client.blink.findUnique({
      where: {
        id: input.blinkId,
        workspaceId: input.workspaceId,
      },
      include: { creator: true },
    });

    if (!blink) {
      throw new BlinkNotFoundError(input.blinkId);
    }

    return blink;
  }

  async getByRedirectId(redirectId: string) {
    const blink = await database.client.blink.findUnique({
      where: { redirectId },
    });

    if (!blink) {
      throw new BlinkByRedirectNotFoundError(redirectId);
    }

    return blink;
  }

  async update(input: BlinkUpdateInput) {
    const blink = await database.client.blink.findUnique({
      where: {
        id: input.blinkId,
        workspaceId: input.workspaceId,
      },
    });

    if (!blink) {
      throw new BlinkNotFoundError(input.blinkId);
    }

    const updatedBlink = await database.client.blink.update({
      where: { id: input.blinkId },
      data: {
        name: input.name,
        url: input.url,
        redirectId: input.redirectId,
      },
      include: { creator: true },
    });

    return updatedBlink;
  }

  async delete(input: BlinkByIdInput) {
    const blink = await database.client.blink.findUnique({
      where: { id: input.blinkId },
    });

    if (!blink) {
      throw new BlinkNotFoundError(input.blinkId);
    }

    await database.client.blink.deleteMany({
      where: { id: input.blinkId },
    });
  }
}

export default BlinkService;
