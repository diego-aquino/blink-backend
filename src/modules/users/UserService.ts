import { createId } from '@paralleldrive/cuid2';
import database from '@/database/client';
import { EmailAlreadyInUseError, UserNotFoundError } from './errors';
import { CreateUserInput, GetUserByIdInput, UpdateUserInput } from './validators';
import { hashPassword } from '@/utils/auth';

class UserService {
  async create(input: CreateUserInput) {
    const numberOfEmailUses = await database.user.count({
      where: { email: input.email },
    });

    if (numberOfEmailUses > 0) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const user = await database.user.create({
      data: {
        id: createId(),
        name: input.name,
        email: input.email,
        type: 'NORMAL',
        hashedPassword: await hashPassword(input.password),
      },
    });

    return user;
  }

  async getById(input: GetUserByIdInput) {
    const user = await database.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }

  async update(input: UpdateUserInput) {
    const user = await database.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const numberOfEmailUses = await database.user.count({
      where: {
        email: input.email,
        NOT: { id: input.userId },
      },
    });

    if (numberOfEmailUses > 0) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const updatedUser = await database.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        email: input.email,
      },
    });

    return updatedUser;
  }
}

export default UserService;
