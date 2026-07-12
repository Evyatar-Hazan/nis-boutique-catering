import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStudioAuthSession } from './useStudioAuthSession';

const googleApiMocks = vi.hoisted(() => ({
  requestGoogleAccessToken: vi.fn(),
  fetchGoogleUserEmail: vi.fn(),
}));

vi.mock('../googleApi', () => ({
  requestGoogleAccessToken: googleApiMocks.requestGoogleAccessToken,
  fetchGoogleUserEmail: googleApiMocks.fetchGoogleUserEmail,
}));

describe('useStudioAuthSession', () => {
  beforeEach(() => {
    googleApiMocks.requestGoogleAccessToken.mockReset();
    googleApiMocks.fetchGoogleUserEmail.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores only session metadata in sessionStorage after login', async () => {
    googleApiMocks.requestGoogleAccessToken.mockResolvedValue({
      accessToken: 'token-123',
      expiresAt: Date.now() + 10 * 60_000,
    });
    googleApiMocks.fetchGoogleUserEmail.mockResolvedValue('owner@example.com');

    const onAuthorized = vi.fn().mockResolvedValue(undefined);
    const onStatusChange = vi.fn();
    const onBusyChange = vi.fn();

    const { result } = renderHook(() =>
      useStudioAuthSession({
        isGoogleConfigured: true,
        tokenRefreshWindowMs: 60_000,
        onStatusChange,
        onBusyChange,
        onAuthorized,
      }),
    );

    await act(async () => {
      await result.current.handleLogin();
    });

    const raw = window.sessionStorage.getItem('nis-content-studio-session-v2');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toEqual({
      email: 'owner@example.com',
      expiresAt: expect.any(Number),
    });
    expect(window.localStorage.getItem('nis-content-studio-session-v1')).toBeNull();
    expect(raw).not.toContain('token-123');
  });

  it('clears remembered session metadata instead of opening a background Google popup', async () => {
    window.sessionStorage.setItem(
      'nis-content-studio-session-v2',
      JSON.stringify({
        email: 'owner@example.com',
        expiresAt: Date.now() + 10 * 60_000,
      }),
    );

    const onAuthorized = vi.fn().mockResolvedValue(undefined);
    const onStatusChange = vi.fn();
    const onBusyChange = vi.fn();

    const { result } = renderHook(() =>
      useStudioAuthSession({
        isGoogleConfigured: true,
        tokenRefreshWindowMs: 60_000,
        onStatusChange,
        onBusyChange,
        onAuthorized,
      }),
    );

    await waitFor(() => expect(window.sessionStorage.getItem('nis-content-studio-session-v2')).toBeNull());

    expect(googleApiMocks.requestGoogleAccessToken).not.toHaveBeenCalled();
    expect(onAuthorized).not.toHaveBeenCalled();
    expect(onBusyChange).not.toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenCalledWith('צריך להתחבר שוב עם Google כדי לפתוח את הסטודיו.');
    expect(result.current.authState).toBe('signed-out');
    expect(result.current.session).toBeNull();
  });

  it('clears legacy localStorage sessions during restore', async () => {
    window.localStorage.setItem(
      'nis-content-studio-session-v1',
      JSON.stringify({
        accessToken: 'legacy-token',
        email: 'owner@example.com',
        expiresAt: Date.now() + 10 * 60_000,
      }),
    );

    renderHook(() =>
      useStudioAuthSession({
        isGoogleConfigured: true,
        tokenRefreshWindowMs: 60_000,
        onStatusChange: vi.fn(),
        onBusyChange: vi.fn(),
        onAuthorized: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => expect(window.localStorage.getItem('nis-content-studio-session-v1')).toBeNull());
  });
});
