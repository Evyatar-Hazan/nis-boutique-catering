import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { createPublicSiteDocument } from '../../../functions/_lib/test/publicSiteDocument';
import { studioApi, type ContentRevisionDto, type PublishHistoryDto, type PublishJobDto } from '../../api/studioApi';
import { PublishPanel } from './PublishPanel';

const revision = (status: ContentRevisionDto['status'], idSuffix: string, version = 1): ContentRevisionDto => ({
  content: createPublicSiteDocument(`${status}-${idSuffix}`),
  createdAt: 1_700_000_000,
  createdBy: 'admin-1',
  id: `00000000-0000-4000-8000-0000000000${idSuffix}`,
  publishedAt: status === 'published' ? 1_700_000_100 : null,
  schemaVersion: 2,
  status,
  updatedAt: 1_700_000_100,
  updatedBy: 'admin-1',
  version,
});

const job = (status: PublishJobDto['status']): PublishJobDto => ({
  attemptCount: 1,
  completedAt: null,
  createdAt: 1_700_000_100,
  errorMessage: status === 'failed' ? 'publish_dispatch_failed' : null,
  githubRunId: null,
  id: '10000000-0000-4000-8000-000000000001',
  idempotencyKey: 'test-key-123',
  operation: 'publish',
  requestedBy: 'admin-1',
  revisionId: '00000000-0000-4000-8000-000000000001',
  sourceRevisionId: null,
  status,
  updatedAt: 1_700_000_100,
});

const renderPanel = (input: {
  readonly draft?: ContentRevisionDto | null;
  readonly hasUnsavedChanges?: boolean;
  readonly history?: PublishHistoryDto;
} = {}) => {
  const draft = input.draft === undefined ? revision('draft', '01', 3) : input.draft;
  const history = input.history ?? { jobs: [], revisions: [draft, revision('published', '02')].filter(Boolean) as ContentRevisionDto[] };
  vi.spyOn(studioApi, 'listPublishHistory').mockResolvedValue(history);
  const onContentChanged = vi.fn();
  render(<PublishPanel
    draft={draft}
    hasUnsavedChanges={input.hasUnsavedChanges ?? false}
    onContentChanged={onContentChanged}
    onUnauthorized={vi.fn()}
  />);
  return { draft, onContentChanged };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('publish and history UX', () => {
  it('shows precise draft/live badges and blocks publish while changes are unsaved', async () => {
    renderPanel({ hasUnsavedChanges: true });
    expect(await screen.findByText('טיוטה · גרסה 3')).toBeInTheDocument();
    expect(screen.getByText(/חי ·/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'פרסם גרסה 3' })).toBeDisabled();
    expect(screen.getByText('יש לשמור את השינויים לפני פרסום.')).toBeInTheDocument();
  });

  it('requires revision-specific confirmation and prevents a double publish', async () => {
    const publish = vi.spyOn(studioApi, 'publishDraft').mockResolvedValue({ job: job('dispatched'), revision: revision('published', '01', 3) });
    const { onContentChanged } = renderPanel();
    fireEvent.click(await screen.findByRole('button', { name: 'פרסם גרסה 3' }));
    expect(screen.getByText('לפרסם את גרסה 3?')).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'אשר פעולה' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1));
    expect(publish.mock.calls[0]?.[0]).toEqual({ draftId: '00000000-0000-4000-8000-000000000001', expectedVersion: 3 });
    expect(publish.mock.calls[0]?.[1]).toMatch(/^studio:publish:/u);
    await waitFor(() => expect(onContentChanged).toHaveBeenCalledTimes(1));
  });

  it('offers retry only for a failed dispatch', async () => {
    const retry = vi.spyOn(studioApi, 'retryPublish').mockResolvedValue({ job: job('dispatched') });
    renderPanel({ history: { jobs: [job('failed'), { ...job('dispatched'), id: '20000000-0000-4000-8000-000000000002' }], revisions: [revision('draft', '01')] } });
    expect(await screen.findAllByRole('button', { name: 'נסה שליחה שוב' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'נסה שליחה שוב' }));
    await waitFor(() => expect(retry).toHaveBeenCalledWith('10000000-0000-4000-8000-000000000001'));
  });

  it('reports a dispatch failure without claiming the live deployment completed', async () => {
    vi.spyOn(studioApi, 'publishDraft').mockResolvedValue({ job: job('failed'), revision: revision('published', '01', 3) });
    renderPanel();
    fireEvent.click(await screen.findByRole('button', { name: 'פרסם גרסה 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'אשר פעולה' }));
    expect(await screen.findByText('גרסה 3 אושרה, אבל שליחת הפריסה נכשלה. אפשר לנסות שוב מההיסטוריה.')).toBeInTheDocument();
    expect(screen.queryByText(/הפריסה הושלמה/u)).not.toBeInTheDocument();
  });

  it('requires rollback confirmation and can create a new draft from live content', async () => {
    const archived = revision('archived', '03');
    const published = revision('published', '02');
    const rollback = vi.spyOn(studioApi, 'rollbackPublish').mockResolvedValue({ job: { ...job('dispatched'), operation: 'rollback' }, revision: published });
    const first = renderPanel({ history: { jobs: [], revisions: [published, archived] } });
    fireEvent.click(await screen.findByRole('button', { name: 'שחזר כגרסה חיה' }));
    expect(screen.getByText('לשחזר את גרסה 00000000?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'אשר פעולה' }));
    await waitFor(() => expect(rollback).toHaveBeenCalledWith(archived.id, expect.stringMatching(/^studio:rollback:/u)));
    first.onContentChanged.mockClear();
    cleanup();
    vi.restoreAllMocks();

    vi.spyOn(studioApi, 'listPublishHistory').mockResolvedValue({ jobs: [], revisions: [published] });
    const saveDraft = vi.spyOn(studioApi, 'saveDraft').mockResolvedValue({ revision: revision('draft', '04') });
    render(<PublishPanel draft={null} hasUnsavedChanges={false} onContentChanged={vi.fn()} onUnauthorized={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'פתח טיוטה מהאתר החי' }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith({ content: published.content, expectedVersion: null }));
  });
});
