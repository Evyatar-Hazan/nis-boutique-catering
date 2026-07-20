import { AlertTriangle, CheckCircle2, Clock3, History, LoaderCircle, RefreshCw, Rocket, RotateCcw, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { StudioApiError } from '../../api/client';
import { studioApi, type ContentRevisionDto, type PublishJobDto } from '../../api/studioApi';
import { useStudioQuery } from '../../hooks/useStudioQuery';

type PendingAction =
  | { readonly idempotencyKey: string; readonly kind: 'publish'; readonly revision: ContentRevisionDto }
  | { readonly idempotencyKey: string; readonly kind: 'rollback'; readonly revision: ContentRevisionDto }
  | null;

const jobLabels: Readonly<Record<PublishJobDto['status'], string>> = {
  dispatched: 'הפריסה הופעלה',
  deploying: 'שולחים לפריסה',
  failed: 'שליחת הפריסה נכשלה',
  queued: 'ממתין לשליחה',
  succeeded: 'הפריסה הושלמה',
};

const formatDate = (seconds: number | null) => seconds
  ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(seconds * 1000))
  : 'לא פורסם';

const operationError = (error: unknown) => error instanceof StudioApiError ? error.message : 'הפעולה נכשלה. אפשר לנסות שוב.';
const idempotencyKey = (operation: 'publish' | 'rollback', id: string) => `studio:${operation}:${id}:${crypto.randomUUID()}`;

export const PublishPanel = ({
  draft,
  hasUnsavedChanges,
  onContentChanged,
  onUnauthorized,
}: {
  readonly draft: ContentRevisionDto | null;
  readonly hasUnsavedChanges: boolean;
  readonly onContentChanged: () => void;
  readonly onUnauthorized: () => void;
}) => {
  const historyQuery = useStudioQuery({ onUnauthorized, query: studioApi.listPublishHistory });
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null);
  const busyRef = useRef<string | null>(null);
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const history = historyQuery.data;
  const published = useMemo(() => history?.revisions.find((revision) => revision.status === 'published') ?? null, [history]);

  useEffect(() => {
    if (pending) confirmationButtonRef.current?.focus();
  }, [pending]);

  const closeConfirmation = () => {
    setPending(null);
    window.requestAnimationFrame(() => confirmationTriggerRef.current?.focus());
  };

  const openConfirmation = (action: Omit<Exclude<PendingAction, null>, 'idempotencyKey'>, trigger: HTMLButtonElement) => {
    confirmationTriggerRef.current = trigger;
    setPending({ ...action, idempotencyKey: idempotencyKey(action.kind, action.revision.id) } as Exclude<PendingAction, null>);
  };

  const handleConfirmationKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && !busyRef.current) {
      event.preventDefault();
      closeConfirmation();
    }
  };

  const run = async <Result,>(
    key: string,
    operation: () => Promise<Result>,
    outcome: string | ((result: Result) => { readonly kind: 'error' | 'success'; readonly text: string }),
  ) => {
    if (busyRef.current) return;
    busyRef.current = key;
    setBusy(key);
    setMessage(null);
    try {
      const result = await operation();
      if (pending) closeConfirmation();
      setMessage(typeof outcome === 'string' ? { kind: 'success', text: outcome } : outcome(result));
      historyQuery.reload();
      onContentChanged();
    } catch (error) {
      if (error instanceof StudioApiError && error.kind === 'auth') onUnauthorized();
      setMessage({ kind: 'error', text: operationError(error) });
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  const confirmAction = () => {
    if (!pending) return;
    if (pending.kind === 'publish') {
      const { revision } = pending;
      void run(`publish:${revision.id}`, () => studioApi.publishDraft(
        { draftId: revision.id, expectedVersion: revision.version },
        pending.idempotencyKey,
      ), (result) => result.job.status === 'failed'
        ? { kind: 'error', text: `גרסה ${revision.version} אושרה, אבל שליחת הפריסה נכשלה. אפשר לנסות שוב מההיסטוריה.` }
        : { kind: 'success', text: `גרסה ${revision.version} אושרה ושליחת הפריסה הופעלה.` });
      return;
    }
    const { revision } = pending;
    void run(`rollback:${revision.id}`, () => studioApi.rollbackPublish(
      revision.id,
      pending.idempotencyKey,
    ), (result) => result.job.status === 'failed'
      ? { kind: 'error', text: 'גרסת השחזור נוצרה, אבל שליחת הפריסה נכשלה. אפשר לנסות שוב מההיסטוריה.' }
      : { kind: 'success', text: 'נוצרה גרסה חיה חדשה מתוכן הגרסה שנבחרה ושליחת הפריסה הופעלה.' });
  };

  const createDraftFromLive = () => {
    if (!published) return;
    void run('create-draft', () => studioApi.saveDraft({ content: published.content, expectedVersion: null }), 'נפתחה טיוטה חדשה מהגרסה החיה.');
  };

  return <section className="publish-panel" aria-labelledby="publish-panel-title">
    <div className="publish-panel-heading">
      <div><p className="eyebrow">טיוטה מול אתר חי</p><h2 id="publish-panel-title">פרסום והיסטוריה</h2><p>שמירת טיוטה אינה משנה את האתר. פרסום או שחזור תמיד דורשים אישור נפרד.</p></div>
      <div className="revision-badges" aria-label="מצב תוכן">
        <span className={draft ? 'has-revision' : ''}><Save aria-hidden="true" />{draft ? `טיוטה · גרסה ${draft.version}` : 'אין טיוטה'}</span>
        <span className={published ? 'is-live' : ''}><Rocket aria-hidden="true" />{published ? `חי · ${formatDate(published.publishedAt)}` : 'טרם פורסם'}</span>
      </div>
    </div>

    <div className="publish-primary-actions">
      {draft ? <div><strong>טיוטה {draft.id.slice(0, 8)} · גרסה {draft.version}</strong><small>{hasUnsavedChanges ? 'יש לשמור את השינויים לפני פרסום.' : 'הטיוטה שמורה ומוכנה לבדיקה לפני פרסום.'}</small></div>
        : <div><strong>אין כרגע טיוטה לעריכה</strong><small>{published ? 'אפשר לפתוח טיוטה חדשה כהעתק של הגרסה החיה.' : 'יש ליצור טיוטה לפני הפרסום הראשון.'}</small></div>}
      {draft && <button className="primary-button" type="button" disabled={busy !== null || hasUnsavedChanges} onClick={(event) => openConfirmation({ kind: 'publish', revision: draft }, event.currentTarget)}><Rocket aria-hidden="true" />פרסם גרסה {draft.version}</button>}
      {!draft && published && <button className="primary-button" type="button" disabled={busy !== null} onClick={createDraftFromLive}>{busy === 'create-draft' ? <LoaderCircle className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}פתח טיוטה מהאתר החי</button>}
    </div>

    {pending && <div className="publish-confirmation" role="alertdialog" aria-modal="false" aria-labelledby="publish-confirmation-title" aria-describedby="publish-confirmation-description" aria-busy={busy !== null}>
      <AlertTriangle aria-hidden="true" />
      <div><strong id="publish-confirmation-title">{pending.kind === 'publish' ? `לפרסם את גרסה ${pending.revision.version}?` : `לשחזר את גרסה ${pending.revision.id.slice(0, 8)}?`}</strong><p id="publish-confirmation-description">{pending.kind === 'publish' ? 'הטיוטה תהפוך לגרסה החיה ותישלח פריסה חדשה.' : 'תיווצר גרסה חיה חדשה מתוכן היסטורי; ההיסטוריה הקיימת לא תימחק.'}</p></div>
      <button className="danger-button" ref={confirmationButtonRef} type="button" disabled={busy !== null} onKeyDown={handleConfirmationKeys} onClick={confirmAction}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : pending.kind === 'publish' ? <Rocket aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}אשר פעולה</button>
      <button className="ghost-button" type="button" disabled={busy !== null} onKeyDown={handleConfirmationKeys} onClick={closeConfirmation}>ביטול</button>
    </div>}

    {message && <div className={`publish-message is-${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.kind === 'error' ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{message.text}</div>}

    {historyQuery.status === 'loading' && <div className="empty-state" role="status"><LoaderCircle className="spin" aria-hidden="true" />טוענים היסטוריית פרסום...</div>}
    {historyQuery.status === 'error' && <div className="empty-state config-warning" role="alert">{historyQuery.error.message}<button className="ghost-button" type="button" onClick={historyQuery.reload}>נסה שוב</button></div>}
    {historyQuery.status === 'success' && history && <div className="publish-history-grid">
      <section aria-labelledby="jobs-title"><h3 id="jobs-title"><Clock3 aria-hidden="true" />פעולות פרסום</h3>{history.jobs.length === 0 ? <p className="empty-state">אין עדיין פעולות פרסום.</p> : <div className="publish-timeline">{history.jobs.map((job) => <article key={job.id} className={`publish-job is-${job.status}`}><div><strong>{job.operation === 'publish' ? 'פרסום' : 'שחזור'} · {job.revisionId.slice(0, 8)}</strong><small>{formatDate(job.createdAt)} · ניסיון {job.attemptCount}</small></div><span>{jobLabels[job.status]}</span>{job.errorMessage && <small className="field-error">{job.errorMessage}</small>}{job.status === 'failed' && <button className="ghost-button" type="button" disabled={busy !== null} onClick={() => { void run(`retry:${job.id}`, () => studioApi.retryPublish(job.id), 'שליחת הפריסה הופעלה מחדש.'); }}><RefreshCw aria-hidden="true" />נסה שליחה שוב</button>}</article>)}</div>}</section>
      <section aria-labelledby="revisions-title"><h3 id="revisions-title"><History aria-hidden="true" />גרסאות תוכן</h3>{history.revisions.length === 0 ? <p className="empty-state">אין עדיין גרסאות.</p> : <div className="revision-history">{history.revisions.map((item) => <article key={item.id}><div><strong>{item.status === 'published' ? 'גרסה חיה' : item.status === 'draft' ? 'טיוטה' : 'גרסה היסטורית'} · {item.id.slice(0, 8)}</strong><small>גרסה {item.version} · {formatDate(item.updatedAt)}</small></div>{item.status === 'archived' && <button className="ghost-button" type="button" disabled={busy !== null} onClick={(event) => openConfirmation({ kind: 'rollback', revision: item }, event.currentTarget)}><RotateCcw aria-hidden="true" />שחזר כגרסה חיה</button>}</article>)}</div>}</section>
    </div>}
  </section>;
};
