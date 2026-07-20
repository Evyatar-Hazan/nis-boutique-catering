import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { ConnectionStatus } from './ConnectionStatus';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('connection status', () => {
  it('announces offline state and clears after reconnection', () => {
    let online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    render(<ConnectionStatus />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    online = false;
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent('השינויים נשארים בדפדפן');

    online = true;
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
