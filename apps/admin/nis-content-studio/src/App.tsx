import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Cloud,
  Eye,
  ImagePlus,
  Lock,
  LogIn,
  MessageCircle,
  MonitorCheck,
  RefreshCw,
  Rocket,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  contentSnapshotSchema,
  galleryCategoryIds,
  validateContentReferences,
  type ContentSnapshot,
  type GalleryItemRecord,
  type ImageAssetRecord,
  type SectionBlockRecord,
  type ServiceRecord,
} from '@monorepo/content-schema';
import { isGoogleConfigured, studioConfig } from './config';
import {
  fetchGoogleUserEmail,
  getDriveFileDownloadUrl,
  openDrivePicker,
  readContentFromSheets,
  requestGoogleAccessToken,
  saveContentToSheets,
  triggerPublish,
  uploadImageToDrive,
} from './googleApi';

type ActiveView = 'preview' | 'settings' | 'services' | 'gallery' | 'sections' | 'media';
type AuthState = 'signed-out' | 'loading' | 'authorized' | 'denied';
type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'published' | 'error';

type Session = {
  readonly accessToken: string;
  readonly email: string;
};

const emptyContent: ContentSnapshot = {
  version: '1',
  updatedAt: new Date(0).toISOString(),
  settings: {
    phoneDisplay: '',
    phoneHref: 'tel:',
    email: 'studio@nisboutiquecatering.com',
    whatsappBase: 'https://wa.me/',
    siteVersion: 'draft',
  },
  media: [],
  gallery: [],
  services: [],
  sections: [],
};

const editableCategories = galleryCategoryIds.filter((category) => category !== 'all');
const publicSiteOrigin = 'https://nisboutiquecatering.com';

const categoryLabels: Readonly<Record<GalleryItemRecord['category'], string>> = {
  tables: 'שולחנות',
  trays: 'מגשים',
  salads: 'סלטים',
  coffee: 'קפה',
  fish: 'דגים',
};

const sectionGroupLabels: Readonly<Record<string, string>> = {
  hero: 'מסך פתיחה',
  intro: 'פתיח',
  process: 'איך זה עובד',
  faq: 'שאלות ותשובות',
  trust: 'אמון',
  facts: 'נתונים',
  general: 'כללי',
};

const formatError = (error: unknown) => (error instanceof Error ? error.message : 'הפעולה נכשלה');

const updateById = <T extends { id: string }>(items: readonly T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const splitPipeList = (value: string) => value.split('|').map((item) => item.trim()).filter(Boolean);
const joinPipeList = (items: readonly string[]) => items.join(' | ');
const cmsSrcFor = (id: string) => `/media/cms/${id}.webp`;
const publicAssetSrcFor = (src: string) => (src.startsWith('http') ? src : `${publicSiteOrigin}${src}`);

const normalizeMediaId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `media-${Date.now()}`;

export const App = () => {
  const [authState, setAuthState] = useState<AuthState>('signed-out');
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState<ContentSnapshot>(emptyContent);
  const [activeView, setActiveView] = useState<ActiveView>('preview');
  const [publishState, setPublishState] = useState<PublishState>('clean');
  const [status, setStatus] = useState('התחברו כדי לנהל את התוכן האמיתי של האתר.');
  const [isBusy, setIsBusy] = useState(false);
  const [query, setQuery] = useState('');

  const mediaById = useMemo(() => new Map(content.media.map((media) => [media.id, media])), [content.media]);
  const validation = useMemo(() => contentSnapshotSchema.safeParse(content), [content]);
  const referenceIssues = useMemo(() => validateContentReferences(content), [content]);
  const canUseGoogle = Boolean(session && isGoogleConfigured);
  const hasErrors = !validation.success || referenceIssues.length > 0;
  const activeGalleryCount = content.gallery.filter((item) => item.active).length;
  const driveMediaCount = content.media.filter((media) => media.driveFileId).length;
  const filteredGallery = useMemo(
    () =>
      content.gallery
        .filter((item) => `${item.title} ${item.alt} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
        .sort((left, right) => left.order - right.order),
    [content.gallery, query],
  );

  const markDraft = () => {
    if (authState === 'authorized') {
      setPublishState('draft');
      setStatus('יש שינויים שלא פורסמו עדיין. לחצו "עדכן אתר" כדי להעלות אותם לאתר החי.');
    }
  };

  const updateContent = (updater: (current: ContentSnapshot) => ContentSnapshot) => {
    setContent((current) => updater(current));
    markDraft();
  };

  const runTask = async (label: string, task: () => Promise<void>) => {
    setIsBusy(true);
    setStatus(`${label}...`);
    try {
      await task();
    } catch (error) {
      setPublishState('error');
      setStatus(formatError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = () =>
    runTask('מתחברים לגוגל', async () => {
      if (!isGoogleConfigured) {
        throw new Error('חסרה הגדרת Google לסטודיו. צריך להגדיר Client ID ו-Sheet ID.');
      }

      setAuthState('loading');
      const accessToken = await requestGoogleAccessToken();
      const email = await fetchGoogleUserEmail(accessToken);
      const allowed = studioConfig.allowedEditors.length === 0 || studioConfig.allowedEditors.includes(email);

      if (!allowed) {
        setSession(null);
        setAuthState('denied');
        throw new Error('אין למשתמש הזה הרשאה לנהל את האתר.');
      }

      const remoteContent = await readContentFromSheets(accessToken);
      setSession({ accessToken, email });
      setContent(remoteContent);
      setAuthState('authorized');
      setPublishState('clean');
      setStatus('התוכן נטען מה-Sheets. אפשר לערוך וללחוץ "עדכן אתר" כדי לפרסם.');
    });

  const handleRefresh = () => {
    if (!session) {
      return;
    }
    void runTask('מרעננים תוכן מ-Google Sheets', async () => {
      setContent(await readContentFromSheets(session.accessToken));
      setPublishState('clean');
      setStatus('התוכן רוענן מה-Sheets.');
    });
  };

  const saveDraft = async () => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }
    if (hasErrors) {
      throw new Error('יש שדות שצריך לתקן לפני שמירה.');
    }

    setPublishState('saving');
    await saveContentToSheets(session.accessToken, { ...content, updatedAt: new Date().toISOString() });
    setPublishState('draft');
    setStatus('נשמר כטיוטה ב-Google Sheets. האתר החי עדיין לא השתנה.');
  };

  const handleSaveDraft = () => {
    void runTask('שומרים טיוטה', saveDraft);
  };

  const handleUpdateSite = () => {
    if (!session) {
      return;
    }
    void runTask('מעדכנים את האתר', async () => {
      await saveDraft();
      setPublishState('publishing');
      setStatus('הטיוטה נשמרה. מפעילים בנייה ופרסום ב-Cloudflare.');
      await triggerPublish(session.accessToken);
      setPublishState('published');
      setStatus('הפרסום נשלח. Cloudflare בונה את האתר; בדקות הקרובות השינוי יופיע באתר החי.');
    });
  };

  const updateGallery = (id: string, patch: Partial<GalleryItemRecord>) => {
    updateContent((current) => ({ ...current, gallery: updateById(current.gallery, id, patch) }));
  };

  const updateMedia = (id: string, patch: Partial<ImageAssetRecord>) => {
    updateContent((current) => ({ ...current, media: updateById(current.media, id, patch) }));
  };

  const renameMedia = (id: string, nextId: string) => {
    const cleanId = normalizeMediaId(nextId);
    updateContent((current) => ({
      ...current,
      media: current.media.map((media) => (media.id === id ? { ...media, id: cleanId, src: media.driveFileId ? cmsSrcFor(cleanId) : media.src } : media)),
      gallery: current.gallery.map((item) => (item.mediaId === id ? { ...item, mediaId: cleanId } : item)),
      services: current.services.map((service) => (service.mediaId === id ? { ...service, mediaId: cleanId } : service)),
    }));
  };

  const updateService = (id: string, patch: Partial<ServiceRecord>) => {
    updateContent((current) => ({ ...current, services: updateById(current.services, id, patch) }));
  };

  const updateSection = (id: string, patch: Partial<SectionBlockRecord>) => {
    updateContent((current) => ({ ...current, sections: updateById(current.sections, id, patch) }));
  };

  const moveGalleryItem = (id: string, direction: -1 | 1) => {
    updateContent((current) => {
      const sorted = [...current.gallery].sort((left, right) => left.order - right.order);
      const index = sorted.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
        return current;
      }
      const currentItem = sorted[index];
      const nextItem = sorted[nextIndex];
      return {
        ...current,
        gallery: current.gallery.map((item) => {
          if (item.id === currentItem.id) return { ...item, order: nextItem.order };
          if (item.id === nextItem.id) return { ...item, order: currentItem.order };
          return item;
        }),
      };
    });
  };

  const normalizeCmsMetadata = () => {
    updateContent((current) => ({
      ...current,
      media: current.media.map((media) => (media.driveFileId ? { ...media, src: cmsSrcFor(media.id), responsive: true } : media)),
      gallery: current.gallery.map((item, index) => ({ ...item, order: index + 1, driveFileId: undefined })),
    }));
    setStatus('נתיבי המדיה נוקו לכתובות CMS. לחצו "עדכן אתר" כדי לפרסם את הניקוי.');
  };

  const addGalleryItem = () => {
    const id = `gallery-${Date.now()}`;
    updateContent((current) => ({
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

  const addSection = () => {
    const id = `section-${Date.now()}`;
    updateContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id,
          group: 'general',
          title: 'מקטע חדש',
          text: 'טקסט לעריכה',
          items: [],
          active: false,
        },
      ],
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) {
      return;
    }

    void runTask('מעלים תמונה ל-Google Drive', async () => {
      const uploaded = await uploadImageToDrive(session.accessToken, file);
      const id = normalizeMediaId(uploaded.name);
      updateContent((current) => ({
        ...current,
        media: [
          ...current.media,
          {
            id,
            src: cmsSrcFor(id),
            width: uploaded.imageMediaMetadata?.width ?? 1200,
            height: uploaded.imageMediaMetadata?.height ?? 1600,
            sizes: '(max-width: 720px) 100vw, 33vw',
            responsive: true,
            driveFileId: uploaded.id,
            usageNotes: 'תמונה שהועלתה מהסטודיו',
          },
        ],
      }));
      setStatus('התמונה עלתה ל-Drive. חברו אותה לגלריה או לשירות ואז לחצו "עדכן אתר".');
    });
  };

  const handlePickDriveFile = (mediaId: string) => {
    if (!session) {
      return;
    }

    void runTask('בוחרים תמונה מ-Google Drive', async () => {
      const file = await openDrivePicker(session.accessToken);
      updateMedia(mediaId, { driveFileId: file.id, src: cmsSrcFor(mediaId), usageNotes: `מקור בדרייב: ${file.name}` });
      setStatus('נבחר מקור חדש מדרייב. לחצו "עדכן אתר" כדי ליצור ממנו תמונה מהירה באתר.');
    });
  };

  if (authState !== 'authorized' || !session) {
    return (
      <LoginGate
        authState={authState}
        isBusy={isBusy}
        status={status}
        onLogin={handleLogin}
        googleConfigured={isGoogleConfigured}
      />
    );
  }

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
            ['preview', 'תצוגה לפני פרסום'],
            ['settings', 'יצירת קשר'],
            ['services', 'שירותים'],
            ['gallery', 'גלריה'],
            ['sections', 'מקטעי אתר'],
            ['media', 'תמונות בדרייב'],
          ].map(([id, label]) => (
            <button key={id} className={activeView === id ? 'is-active' : ''} onClick={() => setActiveView(id as ActiveView)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="auth-panel">
          <ShieldCheck aria-hidden="true" />
          <strong>{session.email}</strong>
          <span>מחובר ל-Google Sheets + Drive</span>
        </div>
      </aside>

      <section className="studio-main">
        <header className="topbar">
          <div>
            <p className="kicker">ניהול אתר Nis</p>
            <h2>תוכן האתר במקום אחד</h2>
            <p className="topbar-help">שינוי נשמר קודם כטיוטה. הכפתור "עדכן אתר" מפרסם אותו לאתר החי.</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={handleRefresh} disabled={isBusy || !canUseGoogle}>
              <RefreshCw aria-hidden="true" />
              רענון מה-Sheets
            </button>
            <button className="ghost-button" onClick={handleSaveDraft} disabled={isBusy || !canUseGoogle || hasErrors}>
              <Save aria-hidden="true" />
              שמור טיוטה
            </button>
            <button className="publish-button" onClick={handleUpdateSite} disabled={isBusy || !canUseGoogle || hasErrors || !studioConfig.publishUrl}>
              <Rocket aria-hidden="true" />
              עדכן אתר
            </button>
          </div>
        </header>

        <StatusPanel
          publishState={publishState}
          status={hasErrors ? validationErrorText(validation, referenceIssues) : status}
          hasErrors={hasErrors}
        />

        <section className="overview-strip" aria-label="מצב התוכן">
          <Metric label="תמונות פעילות בגלריה" value={String(activeGalleryCount)} />
          <Metric label="תמונות מחוברות ל-Drive" value={String(driveMediaCount)} />
          <Metric label="שירותים באתר" value={String(content.services.length)} />
          <Metric label="גרסת תוכן" value={content.settings.siteVersion || content.version} />
        </section>

        {activeView === 'preview' && (
          <PreviewPanel content={content} mediaById={mediaById} accessToken={session.accessToken} />
        )}

        {activeView === 'settings' && (
          <section className="workspace-panel settings-grid">
            <PanelHeader title="יצירת קשר ו-SEO" text="כאן משנים את פרטי ההתקשרות שמופיעים בכפתורים ובאזור יצירת הקשר באתר." />
            <Field label="טלפון שמוצג באתר" help="מופיע בכפתורי יצירת קשר ובאזור הסיום.">
              <TextInput value={content.settings.phoneDisplay} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, phoneDisplay: value } }))} />
            </Field>
            <Field label="קישור טלפון" help="צריך להתחיל ב-tel: כדי שלחיצה במובייל תפתח שיחה.">
              <TextInput value={content.settings.phoneHref} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, phoneHref: value } }))} />
            </Field>
            <Field label="אימייל" help="מופיע בפרטי קשר ובמטא דאטה של האתר.">
              <TextInput value={content.settings.email} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, email: value } }))} />
            </Field>
            <Field label="קישור WhatsApp" help="כל כפתורי הוואטסאפ באתר משתמשים בכתובת הזו.">
              <TextInput value={content.settings.whatsappBase} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, whatsappBase: value } }))} />
            </Field>
            <Field label="גרסת תוכן" help="סימון פנימי שעוזר לדעת איזו גרסה פורסמה.">
              <TextInput value={content.settings.siteVersion} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, siteVersion: value } }))} />
            </Field>
            <Field label="כותרת SEO" help="כותרת הדף שמופיעה בדפדפן ובשיתוף קישורים.">
              <TextInput value={content.settings.seoTitle ?? ''} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, seoTitle: value || undefined } }))} />
            </Field>
            <Field label="תיאור SEO" help="תיאור קצר למנועי חיפוש ושיתופים.">
              <textarea value={content.settings.seoDescription ?? ''} onChange={(event) => updateContent((current) => ({ ...current, settings: { ...current.settings, seoDescription: event.target.value || undefined } }))} />
            </Field>
          </section>
        )}

        {activeView === 'services' && (
          <section className="workspace-panel">
            <PanelHeader title="שירותים" text="שלושת הכרטיסים המרכזיים באזור 'מה מזמינים' באתר." />
            <div className="cards-list">
              {content.services.map((service) => (
                <article className="edit-card service-card" key={service.id}>
                  <DrivePreviewImage media={mediaById.get(service.mediaId)} accessToken={session.accessToken} />
                  <Field label="שם השירות" help="הכותרת הראשית של כרטיס השירות.">
                    <TextInput value={service.title} onChange={(value) => updateService(service.id, { title: value })} />
                  </Field>
                  <Field label="כותרת משנה" help="שורת ההסבר הקצרה מתחת לשם השירות.">
                    <TextInput value={service.subtitle} onChange={(value) => updateService(service.id, { subtitle: value })} />
                  </Field>
                  <Field label="תיאור" help="הטקסט המרכזי בכרטיס השירות.">
                    <textarea value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} />
                  </Field>
                  <div className="inline-grid">
                    <Field label="מתאים ל..." help="שורת התאמה קצרה באתר.">
                      <TextInput value={service.bestFor} onChange={(value) => updateService(service.id, { bestFor: value })} />
                    </Field>
                    <Field label="משפט הבטחה" help="הדגשה קטנה בכרטיס השירות.">
                      <TextInput value={service.promise} onChange={(value) => updateService(service.id, { promise: value })} />
                    </Field>
                  </div>
                  <Field label="נקודות שירות" help="כל נקודה מופרדת בסימן |">
                    <TextInput value={joinPipeList(service.details)} onChange={(value) => updateService(service.id, { details: splitPipeList(value) })} />
                  </Field>
                  <div className="inline-grid">
                    <Field label="תמונה לשירות" help="איזו תמונה תופיע בכרטיס.">
                      <select value={service.mediaId} onChange={(event) => updateService(service.id, { mediaId: event.target.value })}>
                        {content.media.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                      </select>
                    </Field>
                    <Field label="טקסט כפתור" help="כפתור הפעולה בכרטיס.">
                      <TextInput value={service.cta} onChange={(value) => updateService(service.id, { cta: value })} />
                    </Field>
                  </div>
                  <details className="technical-details">
                    <summary>הגדרות טכניות</summary>
                    <TextInput value={service.id} onChange={(value) => updateService(service.id, { id: value })} />
                    <TextInput value={service.icon} onChange={(value) => updateService(service.id, { icon: value })} />
                  </details>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'gallery' && (
          <section className="workspace-panel">
            <PanelHeader
              title="גלריה"
              text="כל כרטיס כאן הוא תמונה באתר. אפשר להחליט אם היא מוצגת, באיזו קטגוריה ובאיזה סדר."
              action={
                <div className="action-row">
                  <button className="compact-button" onClick={normalizeCmsMetadata}>
                    <Wand2 aria-hidden="true" />
                    ניקוי מדיה
                  </button>
                  <button className="compact-button" onClick={addGalleryItem}>
                    <ImagePlus aria-hidden="true" />
                    הוספת תמונה לגלריה
                  </button>
                </div>
              }
            />
            <label className="search-box">
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם, תיאור או קטגוריה" />
            </label>
            <div className="gallery-editor-grid">
              {filteredGallery.map((item) => {
                const media = mediaById.get(item.mediaId);
                return (
                  <article className={item.active ? 'gallery-edit-card' : 'gallery-edit-card is-muted'} key={item.id}>
                    <DrivePreviewImage media={media} accessToken={session.accessToken} />
                    <div className="card-heading">
                      <div>
                        <p className="kicker">תמונה מספר {item.order}</p>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="row-actions">
                        <button type="button" className="icon-button" onClick={() => moveGalleryItem(item.id, -1)} aria-label="העלאה למעלה">
                          <ArrowUp aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-button" onClick={() => moveGalleryItem(item.id, 1)} aria-label="הורדה למטה">
                          <ArrowDown aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <Field label="שם פנימי לתמונה" help="עוזר לזהות את התמונה בסטודיו.">
                      <TextInput value={item.title} onChange={(value) => updateGallery(item.id, { title: value })} />
                    </Field>
                    <Field label="תיאור נגיש לתמונה" help="לא תמיד מוצג באתר, אבל חשוב לנגישות ול-SEO.">
                      <TextInput value={item.alt} onChange={(value) => updateGallery(item.id, { alt: value })} />
                    </Field>
                    <div className="inline-grid">
                      <Field label="קטגוריה באתר" help="באיזה פילטר בגלריה התמונה תופיע.">
                        <select value={item.category} onChange={(event) => updateGallery(item.id, { category: event.target.value as GalleryItemRecord['category'] })}>
                          {editableCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                        </select>
                      </Field>
                      <Field label="תמונה מחוברת" help="איזה מקור מדיה ישמש לפריט הזה.">
                        <select value={item.mediaId} onChange={(event) => updateGallery(item.id, { mediaId: event.target.value })}>
                          {content.media.map((mediaItem) => <option key={mediaItem.id} value={mediaItem.id}>{mediaLabel(mediaItem, content)}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="toggle-row">
                      <Toggle checked={item.active} label="מוצג באתר" onChange={(checked) => updateGallery(item.id, { active: checked })} />
                      <Toggle checked={item.tall} label="תמונה גבוהה" onChange={(checked) => updateGallery(item.id, { tall: checked })} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeView === 'sections' && (
          <section className="workspace-panel">
            <PanelHeader
              title="מקטעי אתר"
              text="טקסטים קצרים שמזינים אזורים כמו מסך פתיחה, שאלות ותשובות ואמון."
              action={
                <button className="compact-button" onClick={addSection}>
                  <ImagePlus aria-hidden="true" />
                  הוספת מקטע
                </button>
              }
            />
            <div className="cards-list">
              {content.sections.map((section) => (
                <article className="edit-card" key={section.id}>
                  <div className="card-heading">
                    <div>
                      <p className="kicker">{sectionGroupLabels[section.group] ?? section.group}</p>
                      <h3>{section.title || section.id}</h3>
                    </div>
                    <Toggle checked={section.active} label="מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
                  </div>
                  <Field label="כותרת" help="הכותרת שתופיע באזור הזה באתר.">
                    <TextInput value={section.title ?? ''} onChange={(value) => updateSection(section.id, { title: value || undefined })} />
                  </Field>
                  <Field label="טקסט" help="הפסקה המרכזית של המקטע.">
                    <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
                  </Field>
                  <Field label="פריטים" help="רשימה מופרדת בסימן |">
                    <TextInput value={joinPipeList(section.items)} onChange={(value) => updateSection(section.id, { items: splitPipeList(value) })} />
                  </Field>
                  <details className="technical-details">
                    <summary>הגדרות טכניות</summary>
                    <div className="inline-grid">
                      <TextInput value={section.id} onChange={(value) => updateSection(section.id, { id: value })} />
                      <TextInput value={section.group} onChange={(value) => updateSection(section.id, { group: value })} />
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'media' && (
          <section className="workspace-panel">
            <PanelHeader
              title="תמונות בדרייב"
              text="Drive הוא מקור העריכה. האתר יקבל ממנו קבצי WebP מהירים רק אחרי עדכון האתר."
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
                  <DrivePreviewImage media={media} accessToken={session.accessToken} />
                  <Field label="שם תמונה בסטודיו" help="שם קצר באנגלית שמזהה את התמונה במערכת.">
                    <TextInput value={media.id} onChange={(value) => renameMedia(media.id, value)} />
                  </Field>
                  <div className="usage-list">
                    <strong>איפה זה משפיע באתר</strong>
                    <span>{mediaUsage(media.id, content) || 'עדיין לא מחובר לשום אזור באתר'}</span>
                  </div>
                  <div className="inline-grid">
                    <Field label="רוחב" help="נלקח מהתמונה המקורית בדרייב.">
                      <NumberInput value={media.width} onChange={(value) => updateMedia(media.id, { width: value })} />
                    </Field>
                    <Field label="גובה" help="נלקח מהתמונה המקורית בדרייב.">
                      <NumberInput value={media.height} onChange={(value) => updateMedia(media.id, { height: value })} />
                    </Field>
                  </div>
                  <Field label="הערות שימוש" help="הסבר פנימי איפה כדאי להשתמש בתמונה.">
                    <TextInput value={media.usageNotes ?? ''} onChange={(value) => updateMedia(media.id, { usageNotes: value })} />
                  </Field>
                  <div className="asset-path">
                    <Cloud aria-hidden="true" />
                    <span>באתר אחרי פרסום: {media.driveFileId ? cmsSrcFor(media.id) : media.src}</span>
                  </div>
                  <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>בחירה מ-Drive</button>
                  <details className="technical-details">
                    <summary>מקור טכני</summary>
                    <TextInput value={media.src} onChange={(value) => updateMedia(media.id, { src: value })} />
                    <TextInput value={media.driveFileId ?? ''} onChange={(value) => updateMedia(media.id, { driveFileId: value || undefined })} />
                  </details>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

const LoginGate = ({
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
  <main className="login-shell">
    <section className="login-panel" aria-labelledby="login-title">
      <div className="brand-block login-brand">
        <span className="brand-mark">Nis</span>
        <div>
          <p className="kicker">מערכת ניהול פרטית</p>
          <h1 id="login-title">Content Studio</h1>
        </div>
      </div>
      <div className="login-copy">
        <h2>כניסה למורשים בלבד</h2>
        <p>הסטודיו מנהל את התוכן והתמונות של האתר. רק משתמשים שאושרו מראש יכולים לצפות או לערוך אותו.</p>
      </div>
      <div className={authState === 'denied' ? 'login-status is-error' : 'login-status'}>
        {authState === 'denied' ? <ShieldAlert aria-hidden="true" /> : <Lock aria-hidden="true" />}
        <span>{status}</span>
      </div>
      <button className="publish-button login-button" onClick={onLogin} disabled={isBusy || !googleConfigured || authState === 'loading'}>
        <LogIn aria-hidden="true" />
        {authState === 'loading' ? 'מתחברים...' : 'כניסה עם Google'}
      </button>
      {!googleConfigured && <p className="config-warning">חסרה הגדרת Google ולכן אי אפשר להתחבר כרגע.</p>}
    </section>
  </main>
);

const StatusPanel = ({ publishState, status, hasErrors }: { readonly publishState: PublishState; readonly status: string; readonly hasErrors: boolean }) => {
  const icon = hasErrors ? <ShieldAlert aria-hidden="true" /> : publishState === 'published' ? <MonitorCheck aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />;
  return (
    <div className={hasErrors ? 'status-line is-error' : `status-line is-${publishState}`}>
      {icon}
      <span>{status}</span>
    </div>
  );
};

const PreviewPanel = ({
  content,
  mediaById,
  accessToken,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
}) => {
  const heroSection = content.sections.find((section) => section.group === 'hero' && section.active);
  const faqSections = content.sections.filter((section) => section.group === 'faq' && section.active).slice(0, 3);
  const galleryItems = content.gallery.filter((item) => item.active).sort((left, right) => left.order - right.order).slice(0, 6);

  return (
    <section className="workspace-panel preview-panel">
      <PanelHeader title="תצוגה לפני פרסום" text="כך התוכן ייראה בערך באתר אחרי לחיצה על עדכן אתר." />
      <div className="site-preview-hero">
        <p className="kicker">מסך פתיחה</p>
        <h3>{heroSection?.title ?? 'כותרת ראשית באתר'}</h3>
        <p>{heroSection?.text ?? 'טקסט הפתיחה יופיע כאן.'}</p>
        <a href={content.settings.whatsappBase} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden="true" />
          וואטסאפ: {content.settings.phoneDisplay}
        </a>
      </div>
      <div className="preview-services">
        {content.services.map((service) => (
          <article key={service.id}>
            <DrivePreviewImage media={mediaById.get(service.mediaId)} accessToken={accessToken} />
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
      <div className="preview-gallery">
        {galleryItems.map((item) => (
          <article key={item.id} className={item.tall ? 'is-tall' : ''}>
            <DrivePreviewImage media={mediaById.get(item.mediaId)} accessToken={accessToken} />
            <strong>{item.title}</strong>
            <span>{categoryLabels[item.category]}</span>
          </article>
        ))}
      </div>
      {faqSections.length > 0 && (
        <div className="preview-faq">
          {faqSections.map((section) => (
            <article key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

const DrivePreviewImage = ({ media, accessToken }: { readonly media?: ImageAssetRecord; readonly accessToken: string }) => {
  const [preview, setPreview] = useState<{ readonly fileId: string; readonly objectUrl: string; readonly failed: boolean } | null>(null);
  const [failedFallbackSrc, setFailedFallbackSrc] = useState('');
  const fallbackSrc = media?.src ? publicAssetSrcFor(media.src) : '';

  useEffect(() => {
    if (!media?.driveFileId) {
      return undefined;
    }

    const controller = new AbortController();
    let nextObjectUrl = '';

    fetch(getDriveFileDownloadUrl(media.driveFileId), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Drive preview failed');
        }
        return response.blob();
      })
      .then((blob) => {
        nextObjectUrl = URL.createObjectURL(blob);
        setPreview({ fileId: media.driveFileId ?? '', objectUrl: nextObjectUrl, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreview({ fileId: media.driveFileId ?? '', objectUrl: '', failed: true });
        }
      });

    return () => {
      controller.abort();
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [accessToken, media?.driveFileId]);

  const drivePreview = media?.driveFileId && preview?.fileId === media.driveFileId ? preview : null;
  const fallbackFailed = Boolean(fallbackSrc && failedFallbackSrc === fallbackSrc);
  const src = drivePreview?.objectUrl || (fallbackFailed ? '' : fallbackSrc);
  const failed = Boolean(drivePreview?.failed && (!fallbackSrc || fallbackFailed));

  return (
    <div className="media-preview">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => {
            if (drivePreview?.objectUrl && fallbackSrc) {
              setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
              return;
            }
            setFailedFallbackSrc(fallbackSrc);
            setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
          }}
        />
      ) : (
        <div className="empty-preview">
          <Eye aria-hidden="true" />
          <span>{media ? 'אין תצוגה מקדימה. בחרו מקור מדרייב או פרסמו את התמונה לאתר.' : 'לא נבחרה תמונה'}</span>
        </div>
      )}
      {media && (
        <span className={drivePreview?.objectUrl ? 'source-pill is-drive' : 'source-pill'}>
          {drivePreview?.objectUrl ? 'מקור בדרייב' : 'תצוגה מהאתר'}
        </span>
      )}
    </div>
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

const Field = ({ label, help, children }: { readonly label: string; readonly help: string; readonly children: ReactNode }) => (
  <label className="field-block">
    <span>{label}</span>
    <small>{help}</small>
    {children}
  </label>
);

const Toggle = ({ checked, label, onChange }: { readonly checked: boolean; readonly label: string; readonly onChange: (checked: boolean) => void }) => (
  <label className="toggle-control">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <article>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const TextInput = ({ value, onChange, placeholder }: { readonly value: string; readonly onChange: (value: string) => void; readonly placeholder?: string }) => (
  <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
);

const NumberInput = ({ value, onChange }: { readonly value: number; readonly onChange: (value: number) => void }) => (
  <input type="number" value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} />
);

const validationErrorText = (
  validation: ReturnType<typeof contentSnapshotSchema.safeParse>,
  referenceIssues: readonly string[],
) => {
  if (!validation.success) {
    return validation.error.issues[0]?.message ?? 'יש שדות שצריך לתקן.';
  }
  return referenceIssues[0] ?? 'יש שדות שצריך לתקן.';
};

const mediaUsage = (mediaId: string, content: ContentSnapshot) => {
  const usage = [
    ...content.gallery.filter((item) => item.mediaId === mediaId).map((item) => `גלריה: ${item.title}`),
    ...content.services.filter((service) => service.mediaId === mediaId).map((service) => `שירות: ${service.title}`),
  ];
  return usage.join(' | ');
};

const mediaLabel = (media: ImageAssetRecord, content: ContentSnapshot) => {
  const firstGallery = content.gallery.find((item) => item.mediaId === media.id);
  const firstService = content.services.find((service) => service.mediaId === media.id);
  return firstGallery?.title ?? firstService?.title ?? media.id;
};
