import { RequestHandler } from '@/modules/shared/controllers';

import BlinkService from './BlinkService';
import { toBlinkResponse } from './views';
import { blinkCreationSchema, blinkByIdSchema, blinkUpdateSchema, blinkListSchema } from './validators';
import {
  BlinkCreationRequestBody,
  BlinkCreationResponseStatus,
  BlinkCreationSuccessResponseBody,
  BlinkDeletionResponseStatus,
  BlinkGetByIdResponseStatus,
  BlinkGetByIdSuccessResponseBody,
  BlinkListParams,
  BlinkListResponseStatus,
  BlinkListSuccessResponseBody,
  BlinkUpdateRequestBody,
  BlinkUpdateResponseStatus,
  BlinkUpdateSuccessResponseBody,
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
    const input = blinkCreationSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies BlinkCreationRequestBody;

    const blink = await this.blinkService.create(userId, input);

    return response
      .status(201 satisfies BlinkCreationResponseStatus)
      .json(toBlinkResponse(blink) satisfies BlinkCreationSuccessResponseBody);
  };

  list: RequestHandler = async (request, response) => {
    const input = blinkListSchema.parse({
      ...request.query,
      ...request.params,
    }) satisfies BlinkListParams;

    const blinks = await this.blinkService.list(input);

    return response.status(200 satisfies BlinkListResponseStatus).json({
      blinks: blinks.list.map(toBlinkResponse),
      total: blinks.total,
    } satisfies BlinkListSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = blinkByIdSchema.parse(request.params) satisfies BlinkByIdPathParams;
    const blink = await this.blinkService.get(input);

    return response
      .status(200 satisfies BlinkGetByIdResponseStatus)
      .json(toBlinkResponse(blink) satisfies BlinkGetByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = blinkUpdateSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies BlinkByIdPathParams & BlinkUpdateRequestBody;

    const blink = await this.blinkService.update(input);

    return response
      .status(200 satisfies BlinkUpdateResponseStatus)
      .json(toBlinkResponse(blink) satisfies BlinkUpdateSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = blinkByIdSchema.parse(request.params) satisfies BlinkByIdPathParams;
    await this.blinkService.delete(input);

    return response.status(204 satisfies BlinkDeletionResponseStatus).send();
  };
}

export default BlinkController;
