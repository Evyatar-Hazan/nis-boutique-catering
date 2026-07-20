import { Lock, LogIn } from 'lucide-react';

import { publicSiteOrigin } from '../../assetUrlHelpers';
import type { AuthState } from '../../hooks/useStudioAuthSession';

const creatorUrl = 'https://EvyatarHazan.com';

export const LegacyLoginGate = ({
  authState,
  isBusy,
  status,
  onLogin,
  googleConfigured,
}: {
  readonly authState: AuthState;
  readonly isBusy: boolean;
  readonly status: string;
  readonly onLogin: () => void;
  readonly googleConfigured: boolean;
}) => (
  <main className="login-root">
    <section className="login-card" aria-labelledby="login-title">
      <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
      <p className="eyebrow">מערכת ניהול פרטית</p>
      <h1 id="login-title">פאנל ניהול Nis</h1>
      <p>כניסה למורשים בלבד. אחרי התחברות תיפתח מערכת הניהול החדשה במבנה של שוהם.</p>
      <div className={authState === 'denied' ? 'login-status is-error' : 'login-status'}>
        <Lock aria-hidden="true" />
        <span>{status}</span>
      </div>
      <button type="button" className="primary-button" onClick={onLogin} disabled={isBusy || !googleConfigured || authState === 'loading'}>
        <LogIn aria-hidden="true" />
        {authState === 'loading' ? 'מתחברים...' : 'כניסה עם Google'}
      </button>
      {!googleConfigured && <p className="config-warning">חסרה הגדרת Google ולכן אי אפשר להתחבר כרגע.</p>}
      <a href={creatorUrl} target="_blank" rel="noreferrer">נבנה באהבה על ידי EvyatarHazan.com</a>
    </section>
  </main>
);
