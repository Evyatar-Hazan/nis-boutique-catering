import type { ReactNode } from 'react';
import type { ActiveView } from '../../publishWorkflowHelpers';

type StudioSidebarSection = {
  readonly id: ActiveView;
  readonly label: string;
  readonly help: string;
  readonly icon: ReactNode;
};

type StudioSidebarAreaDefinition = {
  readonly id: ActiveView;
};

type StudioSidebarProps = {
  readonly publicSiteOrigin: string;
  readonly creatorUrl: string;
  readonly sessionEmail: string;
  readonly activeView: ActiveView;
  readonly isSidebarHidden: boolean;
  readonly sections: readonly StudioSidebarSection[];
  readonly areaDefinitions: readonly StudioSidebarAreaDefinition[];
  readonly onSetActiveView: (view: ActiveView) => void;
  readonly onLogout: () => void;
};

export const StudioSidebar = ({
  publicSiteOrigin,
  creatorUrl,
  sessionEmail,
  activeView,
  isSidebarHidden,
  sections,
  areaDefinitions,
  onSetActiveView,
  onLogout,
}: StudioSidebarProps) => (
  <aside id="studio-sidebar" className="studio-sidebar" aria-label="ניווט ניהול" aria-hidden={isSidebarHidden} inert={isSidebarHidden ? true : undefined}>
    <div className="brand-block">
      <img className="studio-logo" src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
      <div>
        <h1>Nis Studio</h1>
        <p>ניהול האתר בלי קוד</p>
      </div>
    </div>
    <nav className="nav-stack">
      {sections.map((section) => (
        <button
          key={section.id}
          className={activeView === section.id || (section.id === 'site-map' && areaDefinitions.some((area) => area.id === activeView)) ? 'is-active' : ''}
          onClick={() => onSetActiveView(section.id)}
        >
          {section.icon}
          <span>
            <strong>{section.label}</strong>
            <small>{section.help}</small>
          </span>
        </button>
      ))}
    </nav>
    <div className="auth-panel">
      <strong>{sessionEmail}</strong>
      <span>מחובר ל-Google Sheets + Drive</span>
      <button type="button" className="logout-button" onClick={onLogout}>
        התנתק
      </button>
    </div>
    <a className="creator-credit studio-credit" href={creatorUrl} target="_blank" rel="noreferrer">
      נבנה באהבה על ידי EvyatarHazan.com
    </a>
  </aside>
);
