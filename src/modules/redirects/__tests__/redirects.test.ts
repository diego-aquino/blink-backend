import { describe, it } from 'vitest';

import { HttpMethod } from 'zimic/http';

describe('Redirects', async () => {
  it.each<HttpMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])(
    'should support redirecting %s requests having a registered blink',
    async () => {},
  );

  it('returns an error if a blink with the redirect id is not found', async () => {});
});
