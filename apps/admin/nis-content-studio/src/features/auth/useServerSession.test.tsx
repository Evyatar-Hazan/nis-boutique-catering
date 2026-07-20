import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useServerSession } from './useServerSession';

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  logout: vi.fn(),
  read: vi.fn(),
}));

vi.mock('../../api/studioApi', () => ({
  studioApi: {
    exchangeGoogleCredential: mocks.exchange,
    logout: mocks.logout,
    readSession: mocks.read,
  },
}));

const session = { admin: { displayName: 'Owner', email: 'owner@example.com' }, expiresAt: 2_000_000_000 };

describe('server session hook', () => {
  beforeEach(() => {
    mocks.exchange.mockReset();
    mocks.logout.mockReset();
    mocks.read.mockReset();
    mocks.read.mockResolvedValue(null);
  });

  it('restores an HttpOnly-backed server session without browser storage', async () => {
    mocks.read.mockResolvedValue(session);
    const { result } = renderHook(() => useServerSession());
    await waitFor(() => expect(result.current.state).toBe('authorized'));
    expect(result.current.session).toEqual(session);
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it('exchanges a credential and returns to login when the session expires', async () => {
    mocks.exchange.mockResolvedValue(session);
    const { result } = renderHook(() => useServerSession());
    await waitFor(() => expect(result.current.state).toBe('signed-out'));
    await act(async () => result.current.login('id-token'));
    expect(result.current.state).toBe('authorized');
    act(() => result.current.expireSession());
    expect(result.current.state).toBe('signed-out');
    expect(result.current.status).toContain('שינויים מקומיים לא נמחקו');
  });
});
