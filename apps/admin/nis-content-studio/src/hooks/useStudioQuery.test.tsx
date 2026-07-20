import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StudioApiError } from '../api/client';
import { useStudioQuery } from './useStudioQuery';

describe('studio query state', () => {
  it('moves from loading to schema-validated data', async () => {
    const query = vi.fn().mockResolvedValue({ revision: 1 });
    const { result } = renderHook(() => useStudioQuery({ onUnauthorized: vi.fn(), query }));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual({ revision: 1 });
  });

  it('routes an auth error to the session owner', async () => {
    const onUnauthorized = vi.fn();
    const query = vi.fn().mockRejectedValue(new StudioApiError({
      code: 'invalid_session', kind: 'auth', message: 'expired', status: 401,
    }));
    const { result } = renderHook(() => useStudioQuery({ onUnauthorized, query }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('aborts the active request on unmount', () => {
    const requestSignals: AbortSignal[] = [];
    const query = vi.fn((signal: AbortSignal) => {
      requestSignals.push(signal);
      return new Promise<never>(() => undefined);
    });
    const { unmount } = renderHook(() => useStudioQuery({ onUnauthorized: vi.fn(), query }));
    unmount();
    expect(requestSignals[0]?.aborted).toBe(true);
  });
});
