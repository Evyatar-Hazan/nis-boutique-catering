import { Home, RefreshCw, Rocket, Save } from 'lucide-react';
import type { ActiveView } from '../../publishWorkflowHelpers';

type StudioTopbarAreaDefinition = {
  readonly id: ActiveView;
  readonly title: string;
};

type StudioTopbarProps = {
  readonly activeView: ActiveView;
  readonly areaDefinitions: readonly StudioTopbarAreaDefinition[];
  readonly isBusy: boolean;
  readonly canUseGoogle: boolean;
  readonly hasErrors: boolean;
  readonly hasPublishUrl: boolean;
  readonly onSetActiveView: (view: ActiveView) => void;
  readonly onRefresh: () => void;
  readonly onSaveDraft: () => void;
  readonly onUpdateSite: () => void;
};

const getTopbarTitle = (activeView: ActiveView, areaDefinitions: readonly StudioTopbarAreaDefinition[]) => {
  if (activeView === 'site-map') {
    return 'ניהול מלא של האתר';
  }
  if (activeView === 'gallery') {
    return 'ניהול תמונות';
  }
  if (activeView === 'contact') {
    return 'מטה דאטה ופרסום';
  }
  return areaDefinitions.find((area) => area.id === activeView)?.title ?? 'תוכן האתר';
};

export const StudioTopbar = ({
  activeView,
  areaDefinitions,
  isBusy,
  canUseGoogle,
  hasErrors,
  hasPublishUrl,
  onSetActiveView,
  onRefresh,
  onSaveDraft,
  onUpdateSite,
}: StudioTopbarProps) => (
  <header className="topbar">
    <div>
      <p className="kicker">ניהול אתר Nis</p>
      <h2>{getTopbarTitle(activeView, areaDefinitions)}</h2>
      <p className="topbar-help">כל שינוי מקבל גרסה חדשה ונשמר כטיוטה. רק הכפתור "עדכן אתר" מפרסם לאתר החי.</p>
    </div>
    <div className="topbar-actions">
      {activeView !== 'site-map' && (
        <button className="ghost-button" onClick={() => onSetActiveView('site-map')}>
          <Home aria-hidden="true" />
          חזרה לניהול אתר
        </button>
      )}
      <button className="ghost-button" onClick={onRefresh} disabled={isBusy || !canUseGoogle}>
        <RefreshCw aria-hidden="true" />
        רענון מה-Sheets
      </button>
      <button className="ghost-button" onClick={onSaveDraft} disabled={isBusy || !canUseGoogle || hasErrors}>
        <Save aria-hidden="true" />
        שמור טיוטה
      </button>
      <button className="publish-button" onClick={onUpdateSite} disabled={isBusy || !canUseGoogle || hasErrors || !hasPublishUrl}>
        <Rocket aria-hidden="true" />
        עדכן אתר
      </button>
    </div>
  </header>
);
