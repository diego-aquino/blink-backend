import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import { User } from '@prisma/client';
import database from '@/database/client';
import { EmailAlreadyInUseError, UserNotFoundError } from './errors';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export const getUserByIdSchema = z.object({
  userId: z.string().min(1),
});

type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;

class UserService {
  async create(input: CreateUserInput): Promise<User> {
    const existingUserWithEmail = await database.user.findUnique({
      where: { email: input.email },
    });

    if (existingUserWithEmail) {
      throw new EmailAlreadyInUseError(input.email);
    }

    const user = await database.user.create({
      data: {
        id: createId(),
        name: input.name,
        email: input.email,
        type: 'NORMAL',
        hashedPassword: input.password, // TODO: hash password
      },
    });

    return user;
  }

  async getById(input: GetUserByIdInput): Promise<User> {
    const user = await database.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }
}

export default UserService;
