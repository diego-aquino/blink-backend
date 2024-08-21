import { createJWT, verifyJWT, verifyPassword } from '@/utils/auth';
import database from '@/database/client';
import { createId } from '@paralleldrive/cuid2';

import { AccessTokenPayload, LoginResult, RefreshTokenPayload } from './types';
import { LoginInput, RefreshAuthInput } from './validators';
import { InvalidCredentialsError } from './errors';
import environment from '@/config/environment';
import { User, UserSession } from '@prisma/client';
import { InternalServerError } from '@/errors/http';

class AuthService {
  private static _instance = new AuthService();

  static instance() {
    return this._instance;
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

    const expiresAt = new Date();
    const sessionDurationInDays = Number(environment.JWT_REFRESH_DURATION.replace(/^(\d+)d$/, '$1'));

    if (Number.isNaN(sessionDurationInDays)) {
      throw new InternalServerError(`Invalid session duration: ${environment.JWT_REFRESH_DURATION}`);
    }

    expiresAt.setDate(expiresAt.getDate() + sessionDurationInDays);

    const session = await database.userSession.create({
      data: {
        id: createId(),
        userId: user.id,
        expiresAt,
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

  async refresh(userId: User['id'], sessionId: UserSession['id'], input: RefreshAuthInput) {
    let refreshPayload: Partial<RefreshTokenPayload>;

    try {
      refreshPayload = await verifyJWT<RefreshTokenPayload>(input.refreshToken);
    } catch (error) {
      await this.deleteExpiredSessions(userId);
      throw error;
    }

    if (refreshPayload.sessionId !== sessionId) {
      throw new InvalidCredentialsError();
    }

    const session = await database.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await createJWT<AccessTokenPayload>(
      { userId: session.userId, sessionId: session.id },
      { expirationTime: environment.JWT_ACCESS_DURATION },
    );

    return { accessToken };
  }

  private async deleteExpiredSessions(userId: string) {
    await database.userSession.deleteMany({
      where: {
        userId,
        expiresAt: { lte: new Date() },
      },
    });
  }

  async logout(input: { sessionId: UserSession['id'] }) {
    await database.userSession.delete({
      where: { id: input.sessionId },
    });
  }
}

export default AuthService;
