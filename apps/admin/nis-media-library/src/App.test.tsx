import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { api } from './api';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    api: {
      ...actual.api,
      driveStatus: vi.fn(),
      listAdmins: vi.fn(),
      readSession: vi.fn(),
    },
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.mocked(api.readSession).mockResolvedValue({
      admin: {
        displayName: 'מנהלת הארכיון',
        email: 'owner@example.com',
        id: 'admin-1',
      },
    });
    vi.mocked(api.driveStatus).mockResolvedValue({
      connected: false,
      connectedEmail: null,
      updatedAt: null,
    });
    vi.mocked(api.listAdmins).mockResolvedValue([]);
  });

  it('keeps authorized-user management available before Drive is connected', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'הגדרות' }));

    expect(await screen.findByRole('heading', { name: 'משתמשים מורשים' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'חיבור Google Drive' })).toBeInTheDocument();
  });
});
