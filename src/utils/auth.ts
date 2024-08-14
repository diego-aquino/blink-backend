import environment from '@/config/environment';
import bcrypt from 'bcrypt';
import { EncryptJWT, JWTPayload, base64url, jwtDecrypt } from 'jose';

export async function hashPassword(plainPassword: string, options: { saltRounds?: number } = {}) {
  const hashedPassword = await bcrypt.hash(plainPassword, options.saltRounds ?? 10);
  return hashedPassword;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  const isValidPassword = await bcrypt.compare(plainPassword, hashedPassword);
  return isValidPassword;
}

const DECODED_JWT_SECRET = base64url.decode(environment.JWT_SECRET);
const JWT_ISSUER = 'blink';
const JWT_AUDIENCE = 'blink';

export async function createJWT<Payload extends JWTPayload>(
  payload: Payload,
  options: {
    expirationTime: string;
  },
) {
  const jwt = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(options.expirationTime)
    .encrypt(DECODED_JWT_SECRET);

  return jwt;
}

export async function verifyJWT<Payload extends JWTPayload>(jwt: string) {
  const { payload } = await jwtDecrypt(jwt, DECODED_JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  return payload as Partial<Payload>;
}
