import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import UseCaseService from '../shared/UseCaseService';
import { User } from '@prisma/client';
import database from '@/database/client';
import { ConflictError } from '@/errors/http';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

class CreateUserService extends UseCaseService {
  async run(input: CreateUserInput): Promise<User> {
    const existingUserWithEmail = await database.user.findUnique({
      where: { email: input.email },
    });

    if (existingUserWithEmail) {
      throw new ConflictError(`Email '${input.email}' is already in use by another user.`);
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
}

export default CreateUserService;
