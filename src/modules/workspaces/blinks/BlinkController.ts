import { RequestHandler } from '@/modules/shared/controllers';

import BlinkService from './BlinkService';
import { toBlinkResponse } from './views';
import { createBlinkSchema, blinkByIdSchema, updateBlinkSchema, listBlinksSchema } from './validators';
import {
  CreateBlinkRequestBody,
  CreateBlinkResponseStatus,
  CreateBlinkSuccessResponseBody,
  DeleteBlinkResponseStatus,
  GetBlinkByIdResponseStatus,
  GetBlinkByIdSuccessResponseBody,
  ListBlinksParams,
  ListBlinksResponseStatus,
  ListBlinksSuccessResponseBody,
  UpdateBlinkRequestBody,
  UpdateBlinkResponseStatus,
  UpdateBlinkSuccessResponseBody,
  BlinkByIdPathParams,
} from './types';

class BlinkController {
  private static _instance = new BlinkController();

  static instance() {
    return this._instance;
  }

  private blinkService = BlinkService.instance();

  private constructor() {}

  create: RequestHandler = async (request, response) => {
    const { userId } = request.middlewares.auth.authenticated;
    const input = createBlinkSchema.parse(request.body) satisfies CreateBlinkRequestBody;

    const blink = await this.blinkService.create(userId, input);

    return response
      .status(201 satisfies CreateBlinkResponseStatus)
      .json(toBlinkResponse(blink) satisfies CreateBlinkSuccessResponseBody);
  };

  list: RequestHandler = async (request, response) => {
    const input = listBlinksSchema.parse({
      ...request.params,
      ...request.query,
    }) satisfies ListBlinksParams;

    const blinks = await this.blinkService.list(input);

    return response.status(200 satisfies ListBlinksResponseStatus).json({
      blinks: blinks.list.map(toBlinkResponse),
      total: blinks.total,
    } satisfies ListBlinksSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = blinkByIdSchema.parse(request.params) satisfies BlinkByIdPathParams;
    const blink = await this.blinkService.get(input);

    return response
      .status(200 satisfies GetBlinkByIdResponseStatus)
      .json(toBlinkResponse(blink) satisfies GetBlinkByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateBlinkSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies BlinkByIdPathParams & UpdateBlinkRequestBody;

    const blink = await this.blinkService.update(input);

    return response
      .status(200 satisfies UpdateBlinkResponseStatus)
      .json(toBlinkResponse(blink) satisfies UpdateBlinkSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = blinkByIdSchema.parse(request.params) satisfies BlinkByIdPathParams;
    await this.blinkService.delete(input);

    return response.status(204 satisfies DeleteBlinkResponseStatus).send();
  };
}

export default BlinkController;
