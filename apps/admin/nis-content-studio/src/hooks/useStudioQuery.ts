import { useCallback, useEffect, useState } from 'react';

import { StudioApiError } from '../api/client';

type QueryState<T> =
  | { readonly status: 'idle' | 'loading'; readonly data: T | null; readonly error: null }
  | { readonly status: 'error'; readonly data: T | null; readonly error: StudioApiError }
  | { readonly status: 'success'; readonly data: T; readonly error: null };

export const useStudioQuery = <T,>({
  enabled = true,
  onUnauthorized,
  query,
}: {
  readonly enabled?: boolean;
  readonly onUnauthorized: () => void;
  readonly query: (signal: AbortSignal) => Promise<T>;
}) => {
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ data: null, error: null, status: enabled ? 'loading' : 'idle' });
  const reload = useCallback(() => {
    setState((current) => ({ data: current.data, error: null, status: 'loading' }));
    setGeneration((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void query(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data, error: null, status: 'success' });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const apiError = error instanceof StudioApiError
        ? error
        : new StudioApiError({ code: 'unknown_error', kind: 'network', message: 'הבקשה נכשלה.', status: 0 });
      if (apiError.kind === 'auth') onUnauthorized();
      setState({ data: null, error: apiError, status: 'error' });
    });
    return () => controller.abort();
  }, [enabled, generation, onUnauthorized, query]);

  const presentedState: QueryState<T> = !enabled
    ? { data: null, error: null, status: 'idle' }
    : state.status === 'idle'
      ? { data: null, error: null, status: 'loading' }
      : state;
  return { ...presentedState, reload };
};
