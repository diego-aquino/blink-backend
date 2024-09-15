import { Request } from 'express';

import { RequestHandler } from '@/modules/shared/controllers';

import BlinkService from '../workspaces/blinks/BlinkService';
import { redirectByIdSchema } from './validators';
import { RedirectByIdPathParams } from './types';
import environment from '@/config/environment';
import { Blink } from '@prisma/client';

const REDIRECT_CACHE_SECONDS = environment.NODE_ENV === 'production' ? 5 * 60 : 0;
export const REDIRECT_CACHE_CONTROL = `public, max-age=${REDIRECT_CACHE_SECONDS}, must-revalidate`;
export const REDIRECT_STATUS_CODE = 308;

class RedirectController {
  private static _instance = new RedirectController();

  static instance() {
    return this._instance;
  }

  private blinkService = BlinkService.instance();

  private constructor() {}

  all: RequestHandler = async (request, response) => {
    const input = redirectByIdSchema.parse(request.params) satisfies RedirectByIdPathParams;
    const blink = await this.blinkService.getByRedirectId(input.redirectId);

    const redirectURL = this.createRedirectURL(request, blink);

    response.header('cache-control', REDIRECT_CACHE_CONTROL).redirect(REDIRECT_STATUS_CODE, redirectURL.toString());
    return response;
  };

  private createRedirectURL(request: Request, blink: Blink) {
    const requestURL = new URL(
      request.url.replace(`/${blink.redirectId}`, ''),
      `http://${environment.HOSTNAME}:${environment.PORT}`,
    );

    const redirectURL = new URL(blink.url);
    redirectURL.search = requestURL.search;
    redirectURL.hash = requestURL.hash;

    const requestPathname = requestURL.pathname.startsWith('/') ? requestURL.pathname.slice(1) : requestURL.pathname;
    redirectURL.pathname += requestPathname;

    return redirectURL;
  }
}

export default RedirectController;
