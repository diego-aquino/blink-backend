import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import { User } from '@prisma/client';
import database from '@/database/client';
import { EmailAlreadyInUseError } from './errors';

export const createUserPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserPayload = z.infer<typeof createUserPayloadSchema>;

class CreateUserService {
  async create(input: CreateUserPayload): Promise<User> {
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
}

export default CreateUserService;
