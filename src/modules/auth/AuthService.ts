import { createJWT, verifyJWT, verifyPassword } from '@/utils/auth';
import database from '@/database/client';
import { createId } from '@paralleldrive/cuid2';

import { AccessTokenPayload, AuthToken, RefreshTokenPayload } from './types';
import { LoginInput, RefreshAuthInput } from './validators';
import { InvalidCredentialsError } from './errors';
import environment from '@/config/environment';
import { User, UserSession } from '@prisma/client';

class AuthService {
  private static _instance = new AuthService();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  async login(input: LoginInput): Promise<{
    accessToken: AuthToken;
    refreshToken: AuthToken;
  }> {
    const user = await database.client.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await verifyPassword(input.password, user.hashedPassword);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    await this.deleteExpiredSessions(user.id);
    const session = await this.createSession(user.id);

    const [accessTokenValue, refreshTokenValue] = await Promise.all([
      createJWT<AccessTokenPayload>(
        { userId: user.id, sessionId: session.id },
        { durationInMinutes: environment.JWT_ACCESS_DURATION_IN_MINUTES },
      ),
      createJWT<RefreshTokenPayload>(
        { userId: user.id, sessionId: session.id },
        { durationInMinutes: environment.JWT_REFRESH_DURATION_IN_MINUTES },
      ),
    ]);

    const [accessTokenPayload, refreshTokenPayload] = await Promise.all([
      verifyJWT<AccessTokenPayload>(accessTokenValue),
      verifyJWT<RefreshTokenPayload>(refreshTokenValue),
    ]);

    const accessTokenExpiresAt = new Date((accessTokenPayload.exp ?? 0) * 1000);
    const refreshTokenExpiresAt = new Date((refreshTokenPayload.exp ?? 0) * 1000);

    return {
      accessToken: {
        value: accessTokenValue,
        expiresAt: accessTokenExpiresAt,
      },
      refreshToken: {
        value: refreshTokenValue,
        expiresAt: refreshTokenExpiresAt,
      },
    };
  }

  private async createSession(userId: User['id']) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + environment.JWT_REFRESH_DURATION_IN_MINUTES);

    const session = await database.client.userSession.create({
      data: {
        id: createId(),
        userId,
        expiresAt,
      },
    });

    return session;
  }

  private async deleteExpiredSessions(userId: string) {
    await database.client.userSession.deleteMany({
      where: {
        userId,
        expiresAt: { lte: new Date() },
      },
    });
  }

  async refresh(input: RefreshAuthInput): Promise<{
    accessToken: AuthToken;
  }> {
    const refreshPayload = await verifyJWT<RefreshTokenPayload>(input.refreshToken);

    const session = await database.client.userSession.findUnique({
      where: {
        id: refreshPayload.sessionId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new InvalidCredentialsError();
    }

    const accessTokenValue = await createJWT<AccessTokenPayload>(
      { userId: session.userId, sessionId: session.id },
      { durationInMinutes: environment.JWT_ACCESS_DURATION_IN_MINUTES },
    );

    const accessTokenPayload = await verifyJWT<AccessTokenPayload>(accessTokenValue);
    const accessTokenExpiresAt = new Date((accessTokenPayload.exp ?? 0) * 1000);

    return {
      accessToken: {
        value: accessTokenValue,
        expiresAt: accessTokenExpiresAt,
      },
    };
  }

  async logout(input: { sessionId: UserSession['id'] }) {
    await database.client.userSession.deleteMany({
      where: { id: input.sessionId },
    });
  }
}

export default AuthService;
