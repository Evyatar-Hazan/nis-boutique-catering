import { afterEach, describe, expect, it, vi } from 'vitest';

import { exchangeGoogleCredential, logoutServerSession, readServerSession } from './authClient';

const session = {
  admin: { displayName: 'Evyatar Hazan', email: 'owner@example.com' },
  expiresAt: 2_000_000_000,
};

describe('auth client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('treats an absent cookie as signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(readServerSession()).resolves.toBeNull();
  });

  it('exchanges only the one-time ID credential and uses cookie credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(session));
    vi.stubGlobal('fetch', fetchMock);
    await expect(exchangeGoogleCredential('signed-id-token')).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/google', expect.objectContaining({
      body: JSON.stringify({ credential: 'signed-id-token' }),
      credentials: 'same-origin',
      method: 'POST',
    }));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('accessToken');
  });

  it('logs out through the same-origin server route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'signed_out' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(logoutServerSession()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ credentials: 'same-origin', method: 'POST' }));
  });
});
