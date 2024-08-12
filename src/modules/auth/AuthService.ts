import { createJWT, verifyPassword } from '@/utils/auth';
import database from '@/database/client';
import { createId } from '@paralleldrive/cuid2';

import { LoginResult } from './types';
import { LoginInput } from './validators';
import { InvalidCredentialsError } from './errors';

class AuthService {
  private static instance = new AuthService();

  static singleton() {
    return this.instance;
  }

  private constructor() {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await database.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await verifyPassword(input.password, user.hashedPassword);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const session = await database.userSession.create({
      data: {
        id: createId(),
        userId: user.id,
      },
    });

    const [accessToken, refreshToken] = await Promise.all([
      createJWT({ sessionId: session.id }, { expirationTime: '5m' }),
      createJWT({ sessionId: session.id }, { expirationTime: '30d' }),
    ]);

    return { accessToken, refreshToken };
  }
}

export default AuthService;
