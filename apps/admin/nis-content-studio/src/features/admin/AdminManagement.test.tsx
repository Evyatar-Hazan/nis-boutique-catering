import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { studioApi, type AdminDto } from '../../api/studioApi';
import { AdminManagement } from './AdminManagement';

const admin = (id: string, isActive = true): AdminDto => ({
  activeSessionCount: id === 'editor' ? 2 : 1,
  createdAt: 1,
  displayName: id === 'owner' ? 'Owner' : 'Editor',
  email: `${id}@example.com`,
  googleSubject: id === 'owner' ? 'google-owner' : null,
  id,
  isActive,
  updatedAt: 1,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('admin management', () => {
  it('protects the current administrator and uses explicit confirmation for another admin', async () => {
    vi.spyOn(studioApi, 'listAdmins').mockResolvedValue({ admins: [admin('owner'), admin('editor')] });
    vi.spyOn(studioApi, 'updateAdmin').mockResolvedValue({ admin: admin('editor', false) });
    render(<AdminManagement currentAdminId="owner" onUnauthorized={vi.fn()} />);
    expect((await screen.findAllByRole('button', { name: 'השבת גישה' }))[0]).toBeDisabled();
    const buttons = screen.getAllByRole('button', { name: 'השבת גישה' });
    fireEvent.click(buttons[1]);
    expect(screen.getByText('להשבית ולנתק את כל החיבורים של Editor?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'אשר השבתה' }));
    await waitFor(() => expect(studioApi.updateAdmin).toHaveBeenCalledWith({ id: 'editor', isActive: false }));
    expect(await screen.findByText('הגישה הושבתה וכל החיבורים הפעילים נותקו.')).toBeInTheDocument();
  });

  it('normalizes form values through the API contract and reloads the list', async () => {
    const list = vi.spyOn(studioApi, 'listAdmins').mockResolvedValue({ admins: [admin('owner')] });
    vi.spyOn(studioApi, 'createAdmin').mockResolvedValue({ admin: admin('editor') });
    render(<AdminManagement currentAdminId="owner" onUnauthorized={vi.fn()} />);
    await screen.findByText('Owner');
    fireEvent.change(screen.getByLabelText('שם להצגה'), { target: { value: '  Editor  ' } });
    fireEvent.change(screen.getByLabelText('כתובת Gmail מורשית'), { target: { value: '  EDITOR@example.com  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'הוסף מנהל' }));
    await waitFor(() => expect(studioApi.createAdmin).toHaveBeenCalledWith({ displayName: 'Editor', email: 'EDITOR@example.com' }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });
});
