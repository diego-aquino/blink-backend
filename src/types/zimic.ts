import { HttpSearchParamsSchema } from 'zimic/http';

export type ParsedHttpSearchParams<SerializedParams extends HttpSearchParamsSchema> = {
  [Key in keyof SerializedParams]: SerializedParams[Key] extends `${number}` | undefined
    ? number
    : SerializedParams[Key] extends `${number}`
      ? number
      : SerializedParams[Key] extends `${boolean}` | undefined
        ? boolean
        : SerializedParams[Key] extends `${boolean}`
          ? boolean
          : SerializedParams[Key];
};
