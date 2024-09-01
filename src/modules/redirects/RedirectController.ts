import { RequestHandler } from '@/modules/shared/controllers';

import BlinkService from '../workspaces/blinks/BlinkService';
import { redirectByIdSchema } from './validators';
import { RedirectByIdPathParams } from './types';
import environment from '@/config/environment';

const REDIRECT_CACHE_SECONDS = environment.NODE_ENV === 'production' ? 5 * 60 : 0;
const REDIRECT_CACHE_CONTROL = `public, max-age=${REDIRECT_CACHE_SECONDS}, must-revalidate`;
const REDIRECT_STATUS_CODE = 308;

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

    const requestURL = new URL(request.url);

    const redirectURL = new URL(blink.url);
    redirectURL.search = requestURL.search;
    redirectURL.hash = requestURL.hash;

    response.header('cache-control', REDIRECT_CACHE_CONTROL).redirect(REDIRECT_STATUS_CODE, redirectURL.toString());
    return response;
  };
}

export default RedirectController;
