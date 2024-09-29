import environment from '@/config/environment';
import { CookieOptions } from 'express';

export const ACCESS_COOKIE_NAME = 'blink:access';
export const REFRESH_COOKIE_NAME = 'blink:refresh';

export const AUTH_TOKEN_COOKIE_DEFAULT_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: environment.HTTPS,
  domain: environment.HOSTNAME,
} satisfies CookieOptions;
