import { createJWT, verifyPassword } from '@/utils/auth';
import database from '@/database/client';
import { createId } from '@paralleldrive/cuid2';

import { AccessTokenPayload, LoginResult, RefreshTokenPayload } from './types';
import { LoginInput } from './validators';
import { InvalidCredentialsError } from './errors';
import environment from '@/config/environment';
import { UserSession } from '@prisma/client';

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

    const accessTokenPromise = createJWT<AccessTokenPayload>(
      { userId: user.id, sessionId: session.id },
      { expirationTime: environment.JWT_ACCESS_DURATION },
    );

    const refreshTokenPromise = createJWT<RefreshTokenPayload>(
      { sessionId: session.id },
      { expirationTime: environment.JWT_REFRESH_DURATION },
    );

    const [accessToken, refreshToken] = await Promise.all([accessTokenPromise, refreshTokenPromise]);

    return { accessToken, refreshToken };
  }

  async logout(input: { sessionId: UserSession['id'] }) {
    await database.userSession.delete({
      where: { id: input.sessionId },
    });
  }
}

export default AuthService;
