import { BlinkSchema } from '@/types/generated';
import { InferPathParams } from 'zimic/http';

export type RedirectByIdPathParams = InferPathParams<BlinkSchema, '/:redirectId'>;
