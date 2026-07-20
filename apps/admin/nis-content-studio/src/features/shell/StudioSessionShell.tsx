import { LogOut, ShieldCheck } from 'lucide-react';

import { publicSiteOrigin } from '../../assetUrlHelpers';
import type { StudioServerSession } from '../../api/authClient';

export const StudioSessionShell = ({
  session,
  onLogout,
}: {
  readonly session: StudioServerSession;
  readonly onLogout: () => void;
}) => (
  <main className="admin-root">
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
    <section className="panel" aria-labelledby="session-ready-title">
      <div className="empty-state">
        <ShieldCheck aria-hidden="true" />
        <h2 id="session-ready-title">החיבור לשרת מוכן</h2>
        <p>התוכן ייטען דרך API מאובטח בשלב הבא.</p>
      </div>
    </section>
  </main>
);
