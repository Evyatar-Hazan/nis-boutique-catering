import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { createPublicSiteDocument } from '../../../functions/_lib/test/publicSiteDocument';
import type { ContentRevisionDto } from '../../api/studioApi';
import { ContentStudio } from './ContentStudio';
import { editableSectionIds, sectionLabels } from './contentEditorModel';

const revision = (version = 1): ContentRevisionDto => ({
  content: createPublicSiteDocument(`revision-${version}`),
  createdAt: 1,
  createdBy: 'admin-1',
  id: '00000000-0000-4000-8000-000000000001',
  publishedAt: null,
  schemaVersion: 2,
  status: 'draft',
  updatedAt: version,
  updatedBy: 'admin-1',
  version,
});

const renderStudio = (initialRevision = revision()) => render(<ContentStudio
  initialRevision={initialRevision}
  onDirtyChange={vi.fn()}
  onReload={vi.fn()}
  onUnauthorized={vi.fn()}
/>);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('six-section content studio', () => {
  it.each(editableSectionIds)('loads, edits, validates, saves and restores %s', async (sectionId) => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { content: ReturnType<typeof createPublicSiteDocument> };
      return Response.json({ revision: { ...revision(2), content: request.content } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const view = renderStudio();
    fireEvent.click(screen.getByRole('button', { name: sectionLabels[sectionId] }));
    const title = screen.getByLabelText('כותרת ראשית');
    fireEvent.change(title, { target: { value: `כותרת מעודכנת ${sectionId}` } });
    expect(screen.getByRole('heading', { name: `כותרת מעודכנת ${sectionId}` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'שמור טיוטה' }));
    await screen.findByText('טיוטה גרסה 2 נשמרה.');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { content: ReturnType<typeof createPublicSiteDocument> };
    view.unmount();
    renderStudio({ ...revision(2), content: body.content });
    fireEvent.click(screen.getByRole('button', { name: sectionLabels[sectionId] }));
    expect(screen.getByLabelText('כותרת ראשית')).toHaveValue(`כותרת מעודכנת ${sectionId}`);
  });

  it('blocks invalid content and points to the exact field', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderStudio();
    fireEvent.change(screen.getByLabelText('כותרת ראשית'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'שמור טיוטה' }));
    expect(await screen.findByText('יש שדות שדורשים תיקון לפני השמירה.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /כותרת ראשית/ })).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps local changes and offers a server reload on conflict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      error: { code: 'revision_conflict', message: 'stale' },
    }, { status: 409 })));
    const onReload = vi.fn();
    render(<ContentStudio initialRevision={revision()} onDirtyChange={vi.fn()} onReload={onReload} onUnauthorized={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('כותרת ראשית'), { target: { value: 'שינוי מקומי' } });
    fireEvent.click(screen.getByRole('button', { name: 'שמור טיוטה' }));
    await screen.findByText(/הטיוטה השתנתה במקום אחר/);
    expect(screen.getByLabelText('כותרת ראשית')).toHaveValue('שינוי מקומי');
    fireEvent.click(screen.getByRole('button', { name: 'טען גרסת שרת' }));
    await waitFor(() => expect(onReload).toHaveBeenCalledTimes(1));
  });
});
