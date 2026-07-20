import { AlertTriangle, LoaderCircle, LogOut } from 'lucide-react';
import { useCallback, useState } from 'react';

import { publicSiteOrigin } from '../../assetUrlHelpers';
import { studioApi, type StudioServerSession } from '../../api/studioApi';
import { useStudioQuery } from '../../hooks/useStudioQuery';
import { AdminManagement } from '../admin/AdminManagement';
import { ContentStudio } from '../content/ContentStudio';
import { PublishPanel } from '../publish/PublishPanel';
import { ConnectionStatus } from './ConnectionStatus';

export const StudioSessionShell = ({
  session,
  onLogout,
  onUnauthorized,
}: {
  readonly session: StudioServerSession;
  readonly onLogout: () => void;
  readonly onUnauthorized: () => void;
}) => {
  const draft = useStudioQuery({ onUnauthorized, query: studioApi.readDraft });
  const [draftDirty, setDraftDirty] = useState(false);
  const handleDirtyChange = useCallback((dirty: boolean) => setDraftDirty(dirty), []);

  return <main className="admin-root">
    <div className="admin-grain" aria-hidden="true" />
    <header className="admin-header">
      <div className="admin-brand">
        <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
        <div><p className="eyebrow">Nis Boutique Catering</p><h1>פאנל ניהול</h1><p>חיבור מאובטח ל־Cloudflare פעיל.</p></div>
      </div>
      <div className="header-actions">
        <span>{session.admin.displayName}</span>
        <button type="button" className="ghost-button" onClick={onLogout}><LogOut aria-hidden="true" />התנתק</button>
      </div>
    </header>
    <ConnectionStatus />
    {draft.status === 'loading' && <section className="empty-state" role="status"><LoaderCircle aria-hidden="true" />טוענים טיוטה מאובטחת...</section>}
    {draft.status === 'error' && <section className="empty-state config-warning" role="alert"><AlertTriangle aria-hidden="true" />{draft.error.message}<button className="ghost-button" type="button" onClick={draft.reload}>נסה שוב</button></section>}
    {draft.status === 'success' && !draft.data.revision && <section className="empty-state" role="status">אין כרגע טיוטה לעריכה. אפשר לפתוח טיוטה מהגרסה החיה באזור הפרסום.</section>}
    {draft.status === 'success' && draft.data.revision && <ContentStudio
      initialRevision={draft.data.revision}
      key={`${draft.data.revision.id}:${draft.data.revision.version}`}
      onDirtyChange={handleDirtyChange}
      onReload={draft.reload}
      onSaved={draft.reload}
      onUnauthorized={onUnauthorized}
    />}
    {draft.status === 'success' && <PublishPanel
      draft={draft.data.revision}
      hasUnsavedChanges={draftDirty}
      key="publish-panel"
      onContentChanged={draft.reload}
      onUnauthorized={onUnauthorized}
    />}
    <AdminManagement currentAdminId={session.admin.id} onUnauthorized={onUnauthorized} />
  </main>;
};
