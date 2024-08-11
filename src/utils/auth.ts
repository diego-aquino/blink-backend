import bcrypt from 'bcrypt';

export async function hashPassword(plainPassword: string, options: { saltRounds?: number } = {}) {
  const hashedPassword = await bcrypt.hash(plainPassword, options.saltRounds ?? 10);
  return hashedPassword;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  const isValidPassword = await bcrypt.compare(plainPassword, hashedPassword);
  return isValidPassword;
}
