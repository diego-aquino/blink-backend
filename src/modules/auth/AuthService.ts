import { createJWT, verifyJWT, verifyPassword } from '@/utils/auth';
import database from '@/database/client';
import { createId } from '@paralleldrive/cuid2';

import { AccessTokenPayload, LoginResult, RefreshTokenPayload } from './types';
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

  async login(input: LoginInput): Promise<LoginResult> {
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

    const [accessToken, refreshToken] = await Promise.all([
      createJWT<AccessTokenPayload>(
        { userId: user.id, sessionId: session.id },
        { durationInMinutes: environment.JWT_ACCESS_DURATION_IN_MINUTES },
      ),

      createJWT<RefreshTokenPayload>(
        { sessionId: session.id },
        { durationInMinutes: environment.JWT_REFRESH_DURATION_IN_MINUTES },
      ),
    ]);

    return { accessToken, refreshToken };
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

  async refresh(input: RefreshAuthInput) {
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

    const accessToken = await createJWT<AccessTokenPayload>(
      { userId: session.userId, sessionId: session.id },
      { durationInMinutes: environment.JWT_ACCESS_DURATION_IN_MINUTES },
    );

    return { accessToken };
  }

  async logout(input: { sessionId: UserSession['id'] }) {
    await database.client.userSession.deleteMany({
      where: { id: input.sessionId },
    });
  }
}

export default AuthService;
