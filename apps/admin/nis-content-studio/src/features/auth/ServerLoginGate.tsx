import { Lock } from 'lucide-react';

import { publicSiteOrigin } from '../../assetUrlHelpers';
import { isGoogleConfigured } from '../../config';
import { GoogleIdentityButton } from './GoogleIdentityButton';
import type { ServerSessionState } from './useServerSession';

export const ServerLoginGate = ({
  state,
  status,
  onCredential,
}: {
  readonly state: ServerSessionState;
  readonly status: string;
  readonly onCredential: (credential: string) => void;
}) => (
  <main className="login-root">
    <section className="login-card" aria-labelledby="login-title">
      <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
      <p className="eyebrow">מערכת ניהול פרטית</p>
      <h1 id="login-title">פאנל ניהול Nis</h1>
      <p>כניסה למורשים בלבד. Google מאמת זהות בלבד; התוכן והמדיה נשמרים ב־Cloudflare.</p>
      <div className="login-status" aria-live="polite"><Lock aria-hidden="true" /><span>{status}</span></div>
      <GoogleIdentityButton disabled={state === 'loading' || !isGoogleConfigured} onCredential={onCredential} />
      {!isGoogleConfigured && <p className="config-warning">חסר Google Client ID ולכן אי אפשר להתחבר כרגע.</p>}
      <a href="https://EvyatarHazan.com" target="_blank" rel="noreferrer">נבנה באהבה על ידי EvyatarHazan.com</a>
    </section>
  </main>
);
