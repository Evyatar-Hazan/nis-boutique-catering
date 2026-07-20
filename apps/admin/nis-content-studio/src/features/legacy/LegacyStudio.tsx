import { useMemo, useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  LogOut,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  contentSnapshotSchema,
  type ContentSnapshot,
  type GalleryItemRecord,
  type ImageAssetRecord,
  type SectionBlockRecord,
  type ServiceRecord,
} from '@monorepo/content-schema';
import { isGoogleConfigured, studioConfig } from '../../config';
import {
  readContentFromSheets,
  readStudioAdminsFromSheets,
  saveContentToSheets,
  saveStudioAdminsToSheets,
  triggerPublish,
  uploadImageToDrive,
} from '../../googleApi';
import { publicSiteOrigin } from '../../assetUrlHelpers';
import { useStudioAuthSession } from '../../hooks/useStudioAuthSession';
import {
  getConfiguredStudioAdmins,
  isAllowedStudioAdmin,
  makeAdminId,
  normalizeAdminEmail,
  type StudioAdminRecord,
} from '../../studioAdmins';
import { formatError, validationErrorText } from '../../studioHelpers';
import { EmptyState, Field, Metric, Panel, ToggleField } from './LegacyPrimitives';
import { LegacyNavigation, type LegacyAdminTab } from './LegacyNavigation';
import { LegacyLoginGate } from './LegacyLoginGate';

type SaveState = 'clean' | 'draft' | 'saving' | 'publishing' | 'live' | 'error';

const tokenRefreshWindowMs = 60_000;

const defaultContent: ContentSnapshot = {
  version: '1',
  updatedAt: new Date(0).toISOString(),
  settings: {
    phoneDisplay: '050-000-0000',
    phoneHref: 'tel:0500000000',
    email: 'studio@nisboutiquecatering.com',
    whatsappBase: 'https://wa.me/972500000000',
    siteVersion: 'draft',
    seoTitle: 'Nis Boutique Catering',
    seoDescription: 'קייטרינג בוטיק ביתי לשבתות, אירועים קטנים ומארזים.',
  },
  media: [],
  gallery: [],
  services: [],
  sections: [],
};

const categoryLabels: Readonly<Record<GalleryItemRecord['category'], string>> = {
  tables: 'שולחנות',
  trays: 'מגשים',
  salads: 'סלטים',
  coffee: 'קפה',
  fish: 'דגים',
};

const editableCategories = Object.keys(categoryLabels) as readonly GalleryItemRecord['category'][];

const nextVersion = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    'admin',
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('-');
};

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const splitPipe = (value: string) =>
  value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const joinPipe = (items: readonly string[]) => items.join(' | ');

const sortByOrder = <T extends { readonly order: number }>(items: readonly T[]) =>
  [...items].sort((left, right) => left.order - right.order);

const visible = <T extends { readonly deletedAt?: string }>(items: readonly T[]) =>
  items.filter((item) => !item.deletedAt);

const isValidContent = (content: ContentSnapshot) => contentSnapshotSchema.safeParse(content);

export const LegacyStudio = () => {
  const [activeTab, setActiveTab] = useState<LegacyAdminTab>('admins');
  const [content, setContent] = useState<ContentSnapshot>(defaultContent);
  const [admins, setAdmins] = useState<readonly StudioAdminRecord[]>(getConfiguredStudioAdmins());
  const [status, setStatus] = useState('התחברו כדי לנהל את האתר.');
  const [isBusy, setIsBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('clean');

  const {
    authState,
    session,
    getFreshAccessToken,
    handleLogin: performLogin,
    handleLogout: performLogout,
  } = useStudioAuthSession({
    isGoogleConfigured,
    tokenRefreshWindowMs,
    onStatusChange: setStatus,
    onBusyChange: setIsBusy,
    onAuthorized: async (accessToken, email) => {
      const nextAdmins = await readStudioAdminsFromSheets(accessToken);
      if (!isAllowedStudioAdmin(email, nextAdmins)) {
        throw new Error('אין למשתמש הזה הרשאה לנהל את האתר.');
      }
      const nextContent = await readContentFromSheets(accessToken);
      setAdmins(nextAdmins);
      setContent(nextContent);
      setSaveState('clean');
      setActiveTab('admins');
      setStatus('המערכת החדשה נטענה מ־Google Sheets. אפשר לעבוד.');
    },
  });

  const validation = useMemo(() => isValidContent(content), [content]);
  const hasErrors = !validation.success;
  const activeAdmins = admins.filter((admin) => admin.active).length;
  const activeServices = content.services.filter((service) => service.active && !service.deletedAt).length;
  const activeGallery = content.gallery.filter((item) => item.active && !item.deletedAt).length;
  const sectionsCount = content.sections.filter((section) => section.active && !section.deletedAt).length;

  const runTask = async (label: string, task: () => Promise<void>) => {
    setIsBusy(true);
    setStatus(`${label}...`);
    try {
      await task();
    } catch (error) {
      setSaveState('error');
      setStatus(formatError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const markDraft = () => {
    setSaveState('draft');
    setStatus('יש שינויים שלא נשמרו. שמרו טיוטה או פרסמו לאתר החי.');
  };

  const updateContent = (updater: (current: ContentSnapshot) => ContentSnapshot) => {
    setContent((current) => {
      const siteVersion = nextVersion();
      const next = updater(current);
      return {
        ...next,
        version: siteVersion,
        updatedAt: new Date().toISOString(),
        settings: {
          ...next.settings,
          siteVersion,
        },
      };
    });
    markDraft();
  };

  const saveDraft = async () => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }
    const parsed = contentSnapshotSchema.safeParse(content);
    if (!parsed.success) {
      throw new Error(validationErrorText(parsed, []));
    }

    setSaveState('saving');
    const accessToken = await getFreshAccessToken();
    await saveContentToSheets(accessToken, parsed.data);
    setSaveState('clean');
    setStatus('הטיוטה נשמרה ב־Google Sheets.');
  };

  const publish = async () => {
    if (!session) {
      return;
    }

    await runTask('מפרסמים אתר חי', async () => {
      await saveDraft();
      setSaveState('publishing');
      const accessToken = await getFreshAccessToken();
      await triggerPublish(accessToken);
      setSaveState('live');
      setStatus('הפרסום נשלח. Cloudflare Pages בונה את האתר מהתוכן החדש.');
    });
  };

  const refresh = () => {
    if (!session) {
      return;
    }

    void runTask('מרעננים מ־Google Sheets', async () => {
      const accessToken = await getFreshAccessToken();
      const [nextAdmins, nextContent] = await Promise.all([
        readStudioAdminsFromSheets(accessToken),
        readContentFromSheets(accessToken),
      ]);
      setAdmins(nextAdmins);
      setContent(nextContent);
      setSaveState('clean');
      setStatus('המידע רוענן מ־Google Sheets.');
    });
  };

  const saveAdmins = (nextAdmins: readonly StudioAdminRecord[]) => {
    if (!session) {
      return;
    }

    void runTask('שומרים אדמינים', async () => {
      const accessToken = await getFreshAccessToken();
      await saveStudioAdminsToSheets(accessToken, nextAdmins);
      setAdmins(nextAdmins);
      setStatus('רשימת האדמינים נשמרה.');
    });
  };

  const login = () => {
    void runTask('מתחברים ל־Google', async () => {
      await performLogin();
    });
  };

  const logout = () => {
    performLogout();
    setContent(defaultContent);
    setAdmins(getConfiguredStudioAdmins());
    setSaveState('clean');
    setActiveTab('admins');
  };

  if (authState !== 'authorized' || !session) {
    return (
      <LegacyLoginGate
        authState={authState}
        isBusy={isBusy}
        status={status}
        onLogin={login}
        googleConfigured={isGoogleConfigured}
      />
    );
  }

  return (
    <main className="admin-root">
      <div className="admin-grain" aria-hidden="true" />
      <header className="admin-header">
        <div className="admin-brand">
          <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
          <div>
            <p className="eyebrow">Nis Boutique Catering</p>
            <h1>פאנל ניהול</h1>
            <p>מערכת חדשה מ־0 במבנה של שוהם: טאבים ברורים, רשימות CRUD, שמירה ופרסום בלי הסטודיו הישן.</p>
          </div>
        </div>
        <div className="header-actions">
          <a className="ghost-button" href={publicSiteOrigin} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            אתר חי
          </a>
          <button type="button" className="ghost-button" onClick={refresh} disabled={isBusy}>
            <RefreshCw aria-hidden="true" />
            רענון
          </button>
          <button type="button" className="ghost-button" onClick={logout}>
            <LogOut aria-hidden="true" />
            התנתק
          </button>
        </div>
      </header>

      <LegacyNavigation activeTab={activeTab} onChange={setActiveTab} />

      <section className={saveState === 'error' || hasErrors ? 'status-bar is-error' : 'status-bar'} aria-live="polite">
        {saveState === 'live' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
        <span>{hasErrors ? validationErrorText(validation, []) : status}</span>
      </section>

      <section className="metric-grid" aria-label="מדדי מערכת">
        <Metric label="אדמינים פעילים" value={String(activeAdmins)} />
        <Metric label="אזורי תוכן" value={String(sectionsCount)} />
        <Metric label="שירותים פעילים" value={String(activeServices)} />
        <Metric label="תמונות בגלריה" value={String(activeGallery)} />
        <Metric label="גרסת תוכן" value={content.settings.siteVersion || content.version} />
      </section>

      <section className="admin-content">
        {activeTab === 'admins' && (
          <AdminsTab
            admins={admins}
            currentEmail={session.email}
            isBusy={isBusy}
            onSaveAdmins={saveAdmins}
          />
        )}
        {activeTab === 'sections' && (
          <SectionsTab content={content} onUpdateContent={updateContent} />
        )}
        {activeTab === 'services' && (
          <ServicesTab content={content} onUpdateContent={updateContent} />
        )}
        {activeTab === 'gallery' && (
          <GalleryTab
            content={content}
            isBusy={isBusy}
            onUpdateContent={updateContent}
            onUpload={(file) => {
              void runTask('מעלים תמונה ל־Drive', async () => {
                const accessToken = await getFreshAccessToken();
                const uploaded = await uploadImageToDrive(accessToken, file);
                const mediaId = uploaded.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9א-ת]+/g, '-').replace(/^-+|-+$/g, '') || makeId('media');
                updateContent((current) => ({
                  ...current,
                  media: [
                    ...current.media,
                    {
                      id: mediaId,
                      title: uploaded.name.replace(/\.[^.]+$/, ''),
                      src: `/assets/generated/${mediaId}.webp`,
                      width: uploaded.imageMediaMetadata?.width ?? 1200,
                      height: uploaded.imageMediaMetadata?.height ?? 1600,
                      sizes: '(max-width: 720px) 100vw, 33vw',
                      responsive: true,
                      driveFileId: uploaded.id,
                      usageNotes: 'הועלה ממערכת הניהול החדשה',
                    },
                  ],
                }));
                setStatus('התמונה עלתה ל־Drive ונוספה לספריית המדיה.');
              });
            }}
          />
        )}
        {activeTab === 'contact' && (
          <ContactTab content={content} onUpdateContent={updateContent} />
        )}
        {activeTab === 'publish' && (
          <PublishTab
            content={content}
            hasErrors={hasErrors}
            isBusy={isBusy}
            saveState={saveState}
            onSave={() => {
              void runTask('שומרים טיוטה', saveDraft);
            }}
            onPublish={() => {
              void publish();
            }}
          />
        )}
      </section>
    </main>
  );
};

const AdminsTab = ({
  admins,
  currentEmail,
  isBusy,
  onSaveAdmins,
}: {
  readonly admins: readonly StudioAdminRecord[];
  readonly currentEmail: string;
  readonly isBusy: boolean;
  readonly onSaveAdmins: (admins: readonly StudioAdminRecord[]) => void;
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [picture, setPicture] = useState('');

  const addAdmin = () => {
    const normalized = normalizeAdminEmail(email);
    if (!normalized || admins.some((admin) => normalizeAdminEmail(admin.email) === normalized)) {
      return;
    }
    onSaveAdmins([
      ...admins,
      {
        id: makeAdminId(normalized),
        email: normalized,
        name: name.trim() || normalized.split('@')[0] || normalized,
        picture: picture.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    setEmail('');
    setName('');
    setPicture('');
  };

  const updateAdmin = (id: string, patch: Partial<StudioAdminRecord>) => {
    onSaveAdmins(admins.map((admin) => (admin.id === id ? { ...admin, ...patch } : admin)));
  };

  return (
    <Panel
      title="ניהול אדמינים"
      text="כמו בשוהם: מוסיפים אדמין לפי אימייל, כולם באותה רמת הרשאה, ואפשר לכבות משתמש בלי למחוק אותו."
      action={<button type="button" className="primary-button" onClick={addAdmin} disabled={isBusy || !email.trim()}><Plus aria-hidden="true" />הוסף אדמין</button>}
    >
      <div className="form-grid">
        <Field label="אימייל">
          <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        </Field>
        <Field label="שם מלא">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="שם שיופיע במערכת" />
        </Field>
        <Field label="תמונה">
          <input value={picture} onChange={(event) => setPicture(event.target.value)} placeholder="קישור אופציונלי לתמונה" />
        </Field>
      </div>

      <div className="card-grid">
        {admins.map((admin) => {
          const isCurrent = normalizeAdminEmail(admin.email) === normalizeAdminEmail(currentEmail);
          return (
            <article key={admin.id} className={admin.active ? 'data-card' : 'data-card is-muted'}>
              <div className="card-title-row">
                {admin.picture ? <img src={admin.picture} alt="" /> : <span>{admin.name.slice(0, 1)}</span>}
                <div>
                  <h3>{admin.name}</h3>
                  <p>{admin.email}</p>
                </div>
              </div>
              <div className="card-actions">
                <ToggleField
                  label={admin.active ? 'פעיל' : 'כבוי'}
                  checked={admin.active}
                  onChange={(active) => updateAdmin(admin.id, { active })}
                />
                <button
                  type="button"
                  className="danger-button"
                  disabled={isCurrent || admins.length <= 1}
                  onClick={() => onSaveAdmins(admins.filter((item) => item.id !== admin.id))}
                >
                  <Trash2 aria-hidden="true" />
                  מחק
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
};

const SectionsTab = ({
  content,
  onUpdateContent,
}: {
  readonly content: ContentSnapshot;
  readonly onUpdateContent: (updater: (content: ContentSnapshot) => ContentSnapshot) => void;
}) => {
  const addSection = () => {
    const order = content.sections.length + 1;
    onUpdateContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: makeId('section'),
          group: 'site-copy',
          title: 'אזור חדש',
          text: 'כתבו כאן טקסט לאתר.',
          items: [],
          active: true,
          order,
        },
      ],
    }));
  };

  const updateSection = (id: string, patch: Partial<SectionBlockRecord>) => {
    onUpdateContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    }));
  };

  return (
    <Panel
      title="אזורי תוכן"
      text="רשימה שטוחה וברורה של אזורי האתר. אין SiteMap ישן, אין preview כבד — עורכים ושומרים."
      action={<button type="button" className="primary-button" onClick={addSection}><Plus aria-hidden="true" />הוסף אזור</button>}
    >
      <div className="stack-list">
        {sortByOrder(visible(content.sections)).map((section) => (
          <article key={section.id} className="edit-card">
            <div className="edit-card-header">
              <strong>{section.title || section.id}</strong>
              <ToggleField label="מוצג באתר" checked={section.active} onChange={(active) => updateSection(section.id, { active })} />
            </div>
            <div className="form-grid">
              <Field label="כותרת">
                <input value={section.title ?? ''} onChange={(event) => updateSection(section.id, { title: event.target.value || undefined })} />
              </Field>
              <Field label="קבוצה">
                <input value={section.group} onChange={(event) => updateSection(section.id, { group: event.target.value })} />
              </Field>
              <Field label="סדר">
                <input type="number" value={section.order} onChange={(event) => updateSection(section.id, { order: Number(event.target.value) })} />
              </Field>
            </div>
            <Field label="טקסט">
              <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
            </Field>
            <Field label="פריטים, מופרדים ב־|">
              <input value={joinPipe(section.items)} onChange={(event) => updateSection(section.id, { items: splitPipe(event.target.value) })} />
            </Field>
            <button type="button" className="danger-button" onClick={() => updateSection(section.id, { deletedAt: new Date().toISOString() })}>
              <Trash2 aria-hidden="true" />
              ארכב אזור
            </button>
          </article>
        ))}
        {visible(content.sections).length === 0 && <EmptyState text="אין עדיין אזורי תוכן." />}
      </div>
    </Panel>
  );
};

const ServicesTab = ({
  content,
  onUpdateContent,
}: {
  readonly content: ContentSnapshot;
  readonly onUpdateContent: (updater: (content: ContentSnapshot) => ContentSnapshot) => void;
}) => {
  const addService = () => {
    onUpdateContent((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: makeId('service'),
          title: 'חוויה חדשה',
          subtitle: 'כותרת משנה',
          description: 'תיאור קצר ללקוח.',
          bestFor: 'למי זה מתאים',
          promise: 'מה הלקוח מקבל',
          details: ['פרט ראשון'],
          cta: 'דברו איתנו',
          mediaId: current.media[0]?.id ?? 'missing-media',
          icon: 'Sparkles',
          active: true,
          order: current.services.length + 1,
        },
      ],
    }));
  };

  const updateService = (id: string, patch: Partial<ServiceRecord>) => {
    onUpdateContent((current) => ({
      ...current,
      services: current.services.map((service) => (service.id === id ? { ...service, ...patch } : service)),
    }));
  };

  return (
    <Panel
      title="חוויות אירוח"
      text="ניהול השירותים כמו כרטיסי CRUD פשוטים. זה מחליף את עורך השירותים הישן."
      action={<button type="button" className="primary-button" onClick={addService}><Plus aria-hidden="true" />הוסף שירות</button>}
    >
      <div className="stack-list">
        {sortByOrder(visible(content.services)).map((service) => (
          <article key={service.id} className="edit-card">
            <div className="edit-card-header">
              <strong>{service.title}</strong>
              <ToggleField label="מוצג באתר" checked={service.active} onChange={(active) => updateService(service.id, { active })} />
            </div>
            <div className="form-grid">
              <Field label="כותרת">
                <input value={service.title} onChange={(event) => updateService(service.id, { title: event.target.value })} />
              </Field>
              <Field label="כותרת משנה">
                <input value={service.subtitle} onChange={(event) => updateService(service.id, { subtitle: event.target.value })} />
              </Field>
              <Field label="סדר">
                <input type="number" value={service.order} onChange={(event) => updateService(service.id, { order: Number(event.target.value) })} />
              </Field>
            </div>
            <Field label="תיאור">
              <textarea value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} />
            </Field>
            <div className="form-grid">
              <Field label="מתאים ל">
                <input value={service.bestFor} onChange={(event) => updateService(service.id, { bestFor: event.target.value })} />
              </Field>
              <Field label="הבטחה">
                <input value={service.promise} onChange={(event) => updateService(service.id, { promise: event.target.value })} />
              </Field>
              <Field label="CTA">
                <input value={service.cta} onChange={(event) => updateService(service.id, { cta: event.target.value })} />
              </Field>
            </div>
            <Field label="פרטים, מופרדים ב־|">
              <input value={joinPipe(service.details)} onChange={(event) => updateService(service.id, { details: splitPipe(event.target.value) })} />
            </Field>
            <Field label="תמונה">
              <select value={service.mediaId} onChange={(event) => updateService(service.id, { mediaId: event.target.value })}>
                <option value="missing-media">בחרו תמונה</option>
                {content.media.map((media) => (
                  <option key={media.id} value={media.id}>{media.title ?? media.id}</option>
                ))}
              </select>
            </Field>
            <button type="button" className="danger-button" onClick={() => updateService(service.id, { deletedAt: new Date().toISOString() })}>
              <Trash2 aria-hidden="true" />
              ארכב שירות
            </button>
          </article>
        ))}
        {visible(content.services).length === 0 && <EmptyState text="אין עדיין שירותים." />}
      </div>
    </Panel>
  );
};

const GalleryTab = ({
  content,
  isBusy,
  onUpdateContent,
  onUpload,
}: {
  readonly content: ContentSnapshot;
  readonly isBusy: boolean;
  readonly onUpdateContent: (updater: (content: ContentSnapshot) => ContentSnapshot) => void;
  readonly onUpload: (file: File) => void;
}) => {
  const addGalleryItem = () => {
    onUpdateContent((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        {
          id: makeId('gallery'),
          title: 'תמונה חדשה',
          alt: 'תמונה מ־Nis Boutique Catering',
          category: 'tables',
          order: current.gallery.length + 1,
          active: true,
          tall: false,
          mediaId: current.media[0]?.id ?? 'missing-media',
        },
      ],
    }));
  };

  const updateGalleryItem = (id: string, patch: Partial<GalleryItemRecord>) => {
    onUpdateContent((current) => ({
      ...current,
      gallery: current.gallery.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    onUpload(file);
    event.target.value = '';
  };

  return (
    <Panel
      title="גלריה ותמונות"
      text="העלאה ל־Drive, ספריית מדיה ופריטי גלריה — בלי ספריית תמונות ישנה ומסורבלת."
      action={<button type="button" className="primary-button" onClick={addGalleryItem}><Plus aria-hidden="true" />הוסף פריט גלריה</button>}
    >
      <label className="upload-box">
        <Upload aria-hidden="true" />
        <strong>העלאת תמונה ל־Drive</strong>
        <span>התמונה תתווסף לספריית המדיה ותהיה זמינה לשיוך לשירותים ולגלריה.</span>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={isBusy} />
      </label>

      <div className="media-strip">
        {visible<ImageAssetRecord>(content.media).map((media) => (
          <article key={media.id}>
            <ImagePlus aria-hidden="true" />
            <strong>{media.title ?? media.id}</strong>
            <span>{media.driveFileId ? 'מחובר ל־Drive' : 'ללא Drive'}</span>
          </article>
        ))}
      </div>

      <div className="stack-list">
        {sortByOrder(visible(content.gallery)).map((item) => (
          <article key={item.id} className="edit-card">
            <div className="edit-card-header">
              <strong>{item.title}</strong>
              <ToggleField label="מוצג באתר" checked={item.active} onChange={(active) => updateGalleryItem(item.id, { active })} />
            </div>
            <div className="form-grid">
              <Field label="שם">
                <input value={item.title} onChange={(event) => updateGalleryItem(item.id, { title: event.target.value })} />
              </Field>
              <Field label="Alt">
                <input value={item.alt} onChange={(event) => updateGalleryItem(item.id, { alt: event.target.value })} />
              </Field>
              <Field label="קטגוריה">
                <select value={item.category} onChange={(event) => updateGalleryItem(item.id, { category: event.target.value as GalleryItemRecord['category'] })}>
                  {editableCategories.map((category) => (
                    <option key={category} value={category}>{categoryLabels[category]}</option>
                  ))}
                </select>
              </Field>
              <Field label="תמונה">
                <select value={item.mediaId} onChange={(event) => updateGalleryItem(item.id, { mediaId: event.target.value })}>
                  <option value="missing-media">בחרו תמונה</option>
                  {content.media.map((media) => (
                    <option key={media.id} value={media.id}>{media.title ?? media.id}</option>
                  ))}
                </select>
              </Field>
              <Field label="סדר">
                <input type="number" value={item.order} onChange={(event) => updateGalleryItem(item.id, { order: Number(event.target.value) })} />
              </Field>
              <ToggleField label="תמונה גבוהה" checked={item.tall} onChange={(tall) => updateGalleryItem(item.id, { tall })} />
            </div>
            <button type="button" className="danger-button" onClick={() => updateGalleryItem(item.id, { deletedAt: new Date().toISOString() })}>
              <Trash2 aria-hidden="true" />
              ארכב פריט
            </button>
          </article>
        ))}
        {visible(content.gallery).length === 0 && <EmptyState text="אין עדיין פריטי גלריה." />}
      </div>
    </Panel>
  );
};

const ContactTab = ({
  content,
  onUpdateContent,
}: {
  readonly content: ContentSnapshot;
  readonly onUpdateContent: (updater: (content: ContentSnapshot) => ContentSnapshot) => void;
}) => {
  const updateSettings = (patch: Partial<ContentSnapshot['settings']>) => {
    onUpdateContent((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
      },
    }));
  };

  return (
    <Panel title="יצירת קשר ו־SEO" text="כל הפרטים שמופיעים באתר ובשיתוף קישורים במקום אחד ברור.">
      <div className="form-grid">
        <Field label="טלפון מוצג">
          <input value={content.settings.phoneDisplay} onChange={(event) => updateSettings({ phoneDisplay: event.target.value })} />
        </Field>
        <Field label="קישור טלפון">
          <input value={content.settings.phoneHref} onChange={(event) => updateSettings({ phoneHref: event.target.value })} />
        </Field>
        <Field label="אימייל">
          <input type="email" value={content.settings.email} onChange={(event) => updateSettings({ email: event.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <input value={content.settings.whatsappBase} onChange={(event) => updateSettings({ whatsappBase: event.target.value })} />
        </Field>
      </div>
      <Field label="כותרת SEO">
        <input value={content.settings.seoTitle ?? ''} onChange={(event) => updateSettings({ seoTitle: event.target.value || undefined })} />
      </Field>
      <Field label="תיאור SEO">
        <textarea value={content.settings.seoDescription ?? ''} onChange={(event) => updateSettings({ seoDescription: event.target.value || undefined })} />
      </Field>
    </Panel>
  );
};

const PublishTab = ({
  content,
  hasErrors,
  isBusy,
  saveState,
  onSave,
  onPublish,
}: {
  readonly content: ContentSnapshot;
  readonly hasErrors: boolean;
  readonly isBusy: boolean;
  readonly saveState: SaveState;
  readonly onSave: () => void;
  readonly onPublish: () => void;
}) => (
  <Panel title="פרסום" text="שומרים קודם ל־Google Sheets, ואז שולחים בנייה ל־Cloudflare Pages.">
    <div className="publish-grid">
      <article>
        <span>מצב</span>
        <strong>{saveState === 'clean' ? 'נקי' : saveState === 'draft' ? 'טיוטה' : saveState === 'live' ? 'נשלח לפרסום' : saveState}</strong>
      </article>
      <article>
        <span>גרסה</span>
        <strong>{content.settings.siteVersion || content.version}</strong>
      </article>
      <article>
        <span>יעד</span>
        <strong>{publicSiteOrigin.replace('https://', '')}</strong>
      </article>
    </div>
    <div className="publish-actions">
      <button type="button" className="ghost-button" onClick={onSave} disabled={isBusy || hasErrors}>
        <Save aria-hidden="true" />
        שמור טיוטה
      </button>
      <button type="button" className="primary-button" onClick={onPublish} disabled={isBusy || hasErrors || !studioConfig.publishUrl}>
        <Rocket aria-hidden="true" />
        עדכן אתר חי
      </button>
    </div>
    {!studioConfig.publishUrl && <p className="config-warning">חסר חיבור פרסום מאובטח.</p>}
  </Panel>
);
