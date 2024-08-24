import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { EmailAlreadyInUseError, UserNotFoundError } from './errors';
import { CreateUserInput, UserByIdInput, UpdateUserInput } from './validators';
import { hashPassword } from '@/utils/auth';

class UserService {
  private static _instance = new UserService();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  async create(input: CreateUserInput) {
    const numberOfEmailUses = await database.client.user.count({
      where: { email: input.email },
    });

    if (numberOfEmailUses > 0) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const user = await database.client.user.create({
      data: {
        id: createId(),
        name: input.name,
        email: input.email,
        hashedPassword: await hashPassword(input.password),
      },
    });

    return user;
  }

  async getById(input: UserByIdInput) {
    const user = await database.client.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }

  async update(input: UpdateUserInput) {
    const user = await database.client.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    if (input.email && input.email !== user.email) {
      const numberOfEmailUses = await database.client.user.count({
        where: {
          email: input.email,
          NOT: { id: input.userId },
        },
      });

      if (numberOfEmailUses > 0) {
        throw new EmailAlreadyInUseError(input.email);
      }
    }

    const updatedUser = await database.client.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        email: input.email,
      },
    });

    return updatedUser;
  }

  async delete(input: UserByIdInput) {
    const user = await database.client.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    await database.client.user.deleteMany({
      where: { id: input.userId },
    });
  }
}

export default UserService;
