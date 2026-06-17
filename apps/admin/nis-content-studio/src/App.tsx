import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { CheckCircle2, Cloud, ImagePlus, Lock, LogIn, RefreshCw, Rocket, Save, Search, ShieldCheck, Upload } from 'lucide-react';
import { contentSnapshotSchema, galleryCategoryIds, type ContentSnapshot, type GalleryItemRecord, type ImageAssetRecord, type ServiceRecord } from '@monorepo/content-schema';
import { isGoogleConfigured, studioConfig } from './config';
import { demoContent } from './demoContent';
import { fetchGoogleUserEmail, openDrivePicker, readContentFromSheets, requestGoogleAccessToken, saveContentToSheets, triggerPublish, uploadImageToDrive } from './googleApi';

type ActiveView = 'gallery' | 'media' | 'services' | 'settings';

type Session = {
  readonly accessToken: string;
  readonly email: string;
};

const editableCategories = galleryCategoryIds.filter((category) => category !== 'all');

const formatError = (error: unknown) => (error instanceof Error ? error.message : 'פעולה נכשלה');

const updateById = <T extends { id: string }>(items: readonly T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState<ContentSnapshot>(demoContent);
  const [activeView, setActiveView] = useState<ActiveView>('gallery');
  const [status, setStatus] = useState('מצב דמו נטען. התחברו לגוגל כדי לעבוד מול Sheets + Drive.');
  const [isBusy, setIsBusy] = useState(false);
  const [query, setQuery] = useState('');

  const validation = useMemo(() => contentSnapshotSchema.safeParse(content), [content]);
  const canUseGoogle = Boolean(session && isGoogleConfigured);
  const filteredGallery = useMemo(
    () =>
      content.gallery
        .filter((item) => `${item.title} ${item.alt} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
        .sort((left, right) => left.order - right.order),
    [content.gallery, query],
  );

  const runTask = async (label: string, task: () => Promise<void>) => {
    setIsBusy(true);
    setStatus(`${label}...`);
    try {
      await task();
      setStatus(`${label} הושלם.`);
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = () =>
    runTask('מתחבר לגוגל', async () => {
      const accessToken = await requestGoogleAccessToken();
      const email = await fetchGoogleUserEmail(accessToken);
      const allowed = studioConfig.allowedEditors.length === 0 || studioConfig.allowedEditors.includes(email);

      if (!allowed) {
        throw new Error(`המשתמש ${email} לא מורשה לעריכה`);
      }

      setSession({ accessToken, email });
      const remoteContent = await readContentFromSheets(accessToken);
      setContent(remoteContent);
    });

  const handleRefresh = () => {
    if (!session) {
      return;
    }
    void runTask('מרענן תוכן מ-Google Sheets', async () => {
      setContent(await readContentFromSheets(session.accessToken));
    });
  };

  const handleSave = () => {
    if (!session) {
      return;
    }
    void runTask('שומר תוכן ל-Google Sheets', async () => {
      await saveContentToSheets(session.accessToken, { ...content, updatedAt: new Date().toISOString() });
    });
  };

  const handlePublish = () => {
    if (!session || !validation.success) {
      return;
    }
    void runTask('מפעיל פרסום ב-Vercel', async () => {
      await triggerPublish(session.accessToken);
    });
  };

  const updateGallery = (id: string, patch: Partial<GalleryItemRecord>) => {
    setContent((current) => ({ ...current, gallery: updateById(current.gallery, id, patch) }));
  };

  const updateMedia = (id: string, patch: Partial<ImageAssetRecord>) => {
    setContent((current) => ({ ...current, media: updateById(current.media, id, patch) }));
  };

  const updateService = (id: string, patch: Partial<ServiceRecord>) => {
    setContent((current) => ({ ...current, services: updateById(current.services, id, patch) }));
  };

  const addGalleryItem = () => {
    const id = `gallery-${Date.now()}`;
    setContent((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        {
          id,
          title: 'תמונה חדשה',
          alt: 'תיאור נגיש לתמונה חדשה',
          category: 'trays',
          order: current.gallery.length + 1,
          active: false,
          tall: false,
          mediaId: current.media[0]?.id ?? '',
        },
      ],
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) {
      return;
    }

    void runTask('מעלה תמונה ל-Google Drive', async () => {
      const uploaded = await uploadImageToDrive(session.accessToken, file);
      const id = uploaded.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || uploaded.id;
      setContent((current) => ({
        ...current,
        media: [
          ...current.media,
          {
            id,
            src: `/media/cms/${id}.webp`,
            width: uploaded.imageMediaMetadata?.width ?? 1200,
            height: uploaded.imageMediaMetadata?.height ?? 1600,
            sizes: '(max-width: 720px) 100vw, 33vw',
            responsive: true,
            driveFileId: uploaded.id,
            usageNotes: 'Uploaded from Content Studio',
          },
        ],
      }));
    });
  };

  const handlePickDriveFile = (mediaId: string) => {
    if (!session) {
      return;
    }

    void runTask('בוחר קובץ מ-Google Drive', async () => {
      const file = await openDrivePicker(session.accessToken);
      updateMedia(mediaId, { driveFileId: file.id, usageNotes: `Picked from Drive: ${file.name}` });
    });
  };

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar" aria-label="ניווט ניהול">
        <div className="brand-block">
          <span className="brand-mark">Nis</span>
          <div>
            <h1>Content Studio</h1>
            <p>ניהול תוכן, תמונות ופרסום</p>
          </div>
        </div>
        <nav className="nav-stack">
          {[
            ['gallery', 'גלריה'],
            ['media', 'מדיה'],
            ['services', 'שירותים'],
            ['settings', 'הגדרות'],
          ].map(([id, label]) => (
            <button key={id} className={activeView === id ? 'is-active' : ''} onClick={() => setActiveView(id as ActiveView)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="auth-panel">
          <ShieldCheck aria-hidden="true" />
          <strong>{session ? session.email : 'גישה פרטית עם Google Login'}</strong>
          <span>{isGoogleConfigured ? 'מחובר ל-Google Sheets + Drive' : 'חסר env, כרגע במצב דמו'}</span>
        </div>
      </aside>

      <section className="studio-main">
        <header className="topbar">
          <div>
            <p className="kicker">ניהול אתר Nis</p>
            <h2>תוכן האתר במקום אחד</h2>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={handleLogin} disabled={isBusy || !isGoogleConfigured}>
              <LogIn aria-hidden="true" />
              התחברות
            </button>
            <button className="ghost-button" onClick={handleRefresh} disabled={isBusy || !canUseGoogle}>
              <RefreshCw aria-hidden="true" />
              רענון
            </button>
            <button className="primary-button" onClick={handleSave} disabled={isBusy || !canUseGoogle || !validation.success}>
              <Save aria-hidden="true" />
              שמירה
            </button>
            <button className="publish-button" onClick={handlePublish} disabled={isBusy || !canUseGoogle || !validation.success || !studioConfig.publishUrl}>
              <Rocket aria-hidden="true" />
              פרסום
            </button>
          </div>
        </header>

        <div className={validation.success ? 'status-line is-ok' : 'status-line is-error'}>
          {validation.success ? <CheckCircle2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
          <span>{validation.success ? status : validation.error.issues[0]?.message}</span>
        </div>

        {activeView === 'gallery' && (
          <section className="workspace-panel">
            <PanelHeader
              title="גלריה"
              text="שם, alt, קטגוריה, סדר ותמונה מקורית לכל פריט."
              action={
                <button className="compact-button" onClick={addGalleryItem}>
                  <ImagePlus aria-hidden="true" />
                  הוספת פריט
                </button>
              }
            />
            <label className="search-box">
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש בגלריה" />
            </label>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>סדר</th>
                    <th>שם</th>
                    <th>Alt</th>
                    <th>קטגוריה</th>
                    <th>מדיה</th>
                    <th>פעיל</th>
                    <th>גבוה</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGallery.map((item) => (
                    <tr key={item.id}>
                      <td><NumberInput value={item.order} onChange={(value) => updateGallery(item.id, { order: value })} /></td>
                      <td><TextInput value={item.title} onChange={(value) => updateGallery(item.id, { title: value })} /></td>
                      <td><TextInput value={item.alt} onChange={(value) => updateGallery(item.id, { alt: value })} /></td>
                      <td>
                        <select value={item.category} onChange={(event) => updateGallery(item.id, { category: event.target.value as GalleryItemRecord['category'] })}>
                          {editableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={item.mediaId} onChange={(event) => updateGallery(item.id, { mediaId: event.target.value })}>
                          {content.media.map((media) => <option key={media.id} value={media.id}>{media.id}</option>)}
                        </select>
                      </td>
                      <td><input type="checkbox" checked={item.active} onChange={(event) => updateGallery(item.id, { active: event.target.checked })} /></td>
                      <td><input type="checkbox" checked={item.tall} onChange={(event) => updateGallery(item.id, { tall: event.target.checked })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'media' && (
          <section className="workspace-panel">
            <PanelHeader
              title="מדיה"
              text="קבצי מקור בדרייב ומסלולי ה-assets שייווצרו לאתר."
              action={
                <label className="compact-button file-button">
                  <Upload aria-hidden="true" />
                  העלאה ל-Drive
                  <input type="file" accept="image/*" onChange={handleUpload} disabled={!canUseGoogle} />
                </label>
              }
            />
            <div className="media-grid">
              {content.media.map((media) => (
                <article className="media-card" key={media.id}>
                  <div className="media-thumb">
                    <Cloud aria-hidden="true" />
                    <span>{media.width}x{media.height}</span>
                  </div>
                  <TextInput value={media.id} onChange={(value) => updateMedia(media.id, { id: value })} />
                  <TextInput value={media.src} onChange={(value) => updateMedia(media.id, { src: value })} />
                  <TextInput value={media.driveFileId ?? ''} onChange={(value) => updateMedia(media.id, { driveFileId: value || undefined })} placeholder="Drive file id" />
                  <TextInput value={media.usageNotes ?? ''} onChange={(value) => updateMedia(media.id, { usageNotes: value })} placeholder="שימושים באתר" />
                  <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>בחירה מ-Drive</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'services' && (
          <section className="workspace-panel">
            <PanelHeader title="שירותים" text="שלושת שירותי הליבה שמופיעים באתר." />
            <div className="cards-list">
              {content.services.map((service) => (
                <article className="edit-card" key={service.id}>
                  <TextInput value={service.title} onChange={(value) => updateService(service.id, { title: value })} />
                  <TextInput value={service.subtitle} onChange={(value) => updateService(service.id, { subtitle: value })} />
                  <textarea value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} />
                  <TextInput value={service.cta} onChange={(value) => updateService(service.id, { cta: value })} />
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="workspace-panel settings-grid">
            <PanelHeader title="הגדרות אתר" text="פרטי קשר ו-SEO בסיסי." />
            <TextInput value={content.settings.phoneDisplay} onChange={(value) => setContent((current) => ({ ...current, settings: { ...current.settings, phoneDisplay: value } }))} placeholder="טלפון לתצוגה" />
            <TextInput value={content.settings.email} onChange={(value) => setContent((current) => ({ ...current, settings: { ...current.settings, email: value } }))} placeholder="אימייל" />
            <TextInput value={content.settings.whatsappBase} onChange={(value) => setContent((current) => ({ ...current, settings: { ...current.settings, whatsappBase: value } }))} placeholder="WhatsApp URL" />
            <TextInput value={content.settings.seoTitle ?? ''} onChange={(value) => setContent((current) => ({ ...current, settings: { ...current.settings, seoTitle: value } }))} placeholder="SEO title" />
            <textarea value={content.settings.seoDescription ?? ''} onChange={(event) => setContent((current) => ({ ...current, settings: { ...current.settings, seoDescription: event.target.value } }))} placeholder="SEO description" />
          </section>
        )}
      </section>
    </main>
  );
};

const PanelHeader = ({ title, text, action }: { readonly title: string; readonly text: string; readonly action?: ReactNode }) => (
  <div className="panel-header">
    <div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
    {action}
  </div>
);

const TextInput = ({ value, onChange, placeholder }: { readonly value: string; readonly onChange: (value: string) => void; readonly placeholder?: string }) => (
  <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
);

const NumberInput = ({ value, onChange }: { readonly value: number; readonly onChange: (value: number) => void }) => (
  <input type="number" value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} />
);
