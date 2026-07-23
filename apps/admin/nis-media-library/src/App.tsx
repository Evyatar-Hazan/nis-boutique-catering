import {
  FolderHeart,
  HardDrive,
  Images,
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AdminPanel } from './AdminPanel';
import { api, type DriveStatus, type MediaItem, type Session } from './api';
import { GoogleButton } from './GoogleButton';
import { MediaGallery } from './MediaGallery';
import { UploadPanel } from './UploadPanel';

type View = 'library' | 'trash' | 'settings';

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : 'אירעה שגיאה.';

export const App = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [drive, setDrive] = useState<DriveStatus | null>(null);
  const [media, setMedia] = useState<readonly MediaItem[]>([]);
  const [trash, setTrash] = useState<readonly MediaItem[]>([]);
  const [view, setView] = useState<View>('library');
  const [status, setStatus] = useState('בודקים חיבור מאובטח…');

  const loadLibrary = useCallback(async () => {
    try {
      const nextDrive = await api.driveStatus();
      setDrive(nextDrive);
      if (nextDrive.connected) {
        const [active, removed] = await Promise.all([api.listMedia(), api.listMedia(true)]);
        setMedia(active);
        setTrash(removed);
      }
    } catch (error) {
      setStatus(errorText(error));
    }
  }, []);

  useEffect(() => {
    void api.readSession().then((next) => {
      setSession(next);
      setStatus(next ? 'החיבור המאובטח פעיל.' : 'כניסה למורשים בלבד.');
      if (next) void loadLibrary();
    }).catch((error: unknown) => {
      setSession(null);
      setStatus(errorText(error));
    });
  }, [loadLibrary]);

  const login = useCallback((credential: string) => {
    setStatus('מאמתים את החשבון…');
    void api.login(credential).then((next) => {
      setSession(next);
      setStatus('התחברת בהצלחה.');
      void loadLibrary();
    }).catch((error: unknown) => setStatus(errorText(error)));
  }, [loadLibrary]);

  if (session === undefined) {
    return <main className="login-page"><div className="loader" /><p>{status}</p></main>;
  }
  if (!session) {
    return <main className="login-page">
      <section className="login-card">
        <span className="brand-mark">Nis</span>
        <p className="eyebrow">ספרייה פרטית</p>
        <h1>כל התמונות.<br />במקום אחד.</h1>
        <p>ממשק פשוט להעלאה, חיפוש וסידור תמונות הקייטרינג ב־Google Drive.</p>
        <div className="secure-note"><ShieldCheck aria-hidden="true" /><span>{status}</span></div>
        <GoogleButton onCredential={login} />
      </section>
    </main>;
  }

  const mergeMedia = (item: MediaItem) => {
    if (item.trashed) {
      setMedia((current) => current.filter((candidate) => candidate.id !== item.id));
      setTrash((current) => [item, ...current.filter((candidate) => candidate.id !== item.id)]);
    } else {
      setTrash((current) => current.filter((candidate) => candidate.id !== item.id));
      setMedia((current) => [item, ...current.filter((candidate) => candidate.id !== item.id)]);
    }
  };

  const connectDrive = async () => {
    try {
      const { authorizationUrl } = await api.connectDrive();
      window.location.assign(authorizationUrl);
    } catch (error) {
      setStatus(errorText(error));
    }
  };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="ספריית התמונות של Nis"><span>Nis</span><strong>ספריית התמונות</strong></a>
      <div className="session-info"><span>{session.admin.displayName}</span><button type="button" onClick={() => {
        void api.logout().then(() => {
          window.google?.accounts?.id?.disableAutoSelect();
          setSession(null);
        });
      }}><LogOut aria-hidden="true" />יציאה</button></div>
    </header>
    <nav className="primary-nav" aria-label="ניווט ראשי">
      <button className={view === 'library' ? 'is-active' : ''} type="button" onClick={() => setView('library')}><Images aria-hidden="true" /><span>הספרייה</span><small>{media.length}</small></button>
      <button className={view === 'trash' ? 'is-active' : ''} type="button" onClick={() => setView('trash')}><Trash2 aria-hidden="true" /><span>סל</span><small>{trash.length}</small></button>
      <button className={view === 'settings' ? 'is-active' : ''} type="button" onClick={() => setView('settings')}><Settings aria-hidden="true" /><span>הגדרות</span></button>
    </nav>
    <main id="main-content" className="main-content">
      {view === 'settings'
        ? <div className="settings-layout">
            {drive?.connected
              ? <section className="drive-card"><HardDrive aria-hidden="true" /><div><p className="eyebrow">Google Drive מחובר</p><h2>{drive.connectedEmail ?? 'חשבון מחובר'}</h2><p>התמונות נשמרות אוטומטית בתיקיית Nis לפי שנה וחודש.</p></div><button className="secondary-button" type="button" onClick={() => void connectDrive()}>חיבור חשבון אחר</button></section>
              : <section className="drive-card"><HardDrive aria-hidden="true" /><div><p className="eyebrow">Google Drive טרם חובר</p><h2>בחירת חשבון הארכיון</h2><p>חברו את החשבון שאמור להחזיק את תיקיית התמונות של הקייטרינג.</p></div><button className="primary-button" type="button" onClick={() => void connectDrive()}><FolderHeart aria-hidden="true" />חיבור Google Drive</button></section>}
            <AdminPanel />
          </div>
        : !drive?.connected
        ? <section className="connect-drive">
            <span className="connect-icon"><HardDrive aria-hidden="true" /></span>
            <p className="eyebrow">הגדרה חד־פעמית</p>
            <h1>מחברים את תיקיית התמונות</h1>
            <p>חברו את חשבון Google Drive שבו תישמר הספרייה. האפליקציה תיצור תיקייה מסודרת לפי שנה וחודש.</p>
            <button className="primary-button" type="button" onClick={() => void connectDrive()}><FolderHeart aria-hidden="true" />חיבור Google Drive</button>
            <p className="privacy-note"><ShieldCheck aria-hidden="true" />האפליקציה מקבלת גישה רק לקבצים שהיא יוצרת או שנבחרו עבורה.</p>
          </section>
        : <>
            {view === 'library' && <div className="library-layout">
              <UploadPanel onUploaded={(items) => setMedia((current) => [...items, ...current])} />
              <MediaGallery items={media} onChange={mergeMedia} showTrash={false} />
            </div>}
            {view === 'trash' && <MediaGallery items={trash} onChange={mergeMedia} showTrash />}
          </>}
      <p className="global-status" role="status" aria-live="polite">{status}</p>
    </main>
  </div>;
};
