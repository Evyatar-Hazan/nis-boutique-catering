import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { studioApiRequest } from './client';

const schema = z.object({ ok: z.literal(true) }).strict();

describe('studio API transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('retries an idempotent GET after a transient response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: { code: 'busy', message: 'busy' } }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(studioApiRequest({ path: '/api/test', retryDelayMs: 0, schema })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a mutation and maps conflicts explicitly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ error: { code: 'revision_conflict', message: 'stale' } }, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(studioApiRequest({ method: 'PUT', path: '/api/test', schema })).rejects.toMatchObject({
      code: 'revision_conflict', kind: 'conflict', status: 409,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps exhausted network failures and forwards cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(studioApiRequest({ path: '/api/test', retryDelayMs: 0, schema })).rejects.toMatchObject({ kind: 'network', status: 0 });

    const controller = new AbortController();
    controller.abort();
    await expect(studioApiRequest({ path: '/api/test', schema, signal: controller.signal })).rejects.toBeDefined();
  });

  it('fails closed when a successful response violates its schema', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: false })));
    await expect(studioApiRequest({ path: '/api/test', schema })).rejects.toMatchObject({
      code: 'invalid_response', kind: 'server', status: 502,
    });
  });
});
