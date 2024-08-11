import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import { User } from '@prisma/client';
import database from '@/database/client';
import { EmailAlreadyInUseError } from './errors';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserBody = z.infer<typeof createUserSchema>;

class UserService {
  async create(body: CreateUserBody): Promise<User> {
    const existingUserWithEmail = await database.user.findUnique({
      where: { email: body.email },
    });

    if (existingUserWithEmail) {
      throw new EmailAlreadyInUseError(body.email);
    }

    const user = await database.user.create({
      data: {
        id: createId(),
        name: body.name,
        email: body.email,
        type: 'NORMAL',
        hashedPassword: body.password, // TODO: hash password
      },
    });

    return user;
  }
}

export default UserService;
