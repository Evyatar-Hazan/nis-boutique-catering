import { AlertTriangle, CheckCircle2, Cloud, ExternalLink, MonitorCheck, Rocket, Save, ShieldAlert } from 'lucide-react';
import type { ContentSnapshot } from '@monorepo/content-schema';
import { PanelHeader } from './components/editor/PanelHeader';

type ActiveView =
  | 'site-map'
  | 'hero'
  | 'intro-band'
  | 'contact'
  | 'manifesto'
  | 'services'
  | 'experience-lab'
  | 'site-copy'
  | 'site-microcopy'
  | 'audience'
  | 'process'
  | 'story'
  | 'coordination'
  | 'real-media'
  | 'gallery'
  | 'faq'
  | 'media'
  | 'publish';

type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'checking' | 'published' | 'live' | 'error';
type PublishStepState = 'done' | 'active' | 'pending' | 'blocked' | 'error';

type StudioWorkflowStep = {
  readonly step: string;
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

type OwnerVerificationItem = {
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

type PublishProgress = {
  readonly targetVersion: string;
  readonly liveUrl: string;
  readonly totalAttempts: number;
  readonly attempt?: number;
  readonly checkedAt?: string;
  readonly lastBundleUrl?: string;
};

const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <article>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const formatPublishTime = (isoDate: string) =>
  new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(isoDate));

const getBundleFileName = (bundleUrl: string) => {
  try {
    return new URL(bundleUrl).pathname.split('/').at(-1) ?? bundleUrl;
  } catch {
    return bundleUrl;
  }
};

export const StatusPanel = ({
  publishState,
  status,
  hasErrors,
}: {
  readonly publishState: PublishState;
  readonly status: string;
  readonly hasErrors: boolean;
}) => {
  const icon = hasErrors || publishState === 'error'
    ? <ShieldAlert aria-hidden="true" />
    : publishState === 'live'
      ? <MonitorCheck aria-hidden="true" />
      : publishState === 'checking' || publishState === 'publishing'
        ? <Cloud aria-hidden="true" />
        : <CheckCircle2 aria-hidden="true" />;

  return (
    <div className={hasErrors ? 'status-line is-error' : `status-line is-${publishState}`}>
      {icon}
      <span>{status}</span>
    </div>
  );
};

export const EditingWorkflow = ({
  activeView,
  publishState,
  hasErrors,
  hasPublishUrl,
}: {
  readonly activeView: ActiveView;
  readonly publishState: PublishState;
  readonly hasErrors: boolean;
  readonly hasPublishUrl: boolean;
}) => (
  <section className="editing-workflow" aria-label="זרימת עבודה">
    {getStudioWorkflowSteps(activeView, publishState, hasErrors, hasPublishUrl).map(({ step, title, text, state }) => (
      <article className={`is-${state}`} key={step}>
        <strong>{step}</strong>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </article>
    ))}
  </section>
);

export const PublishPanel = ({
  content,
  hasErrors,
  status,
  publishState,
  publishProgress,
  hasPublishUrl,
  onSaveDraft,
  onPublish,
  disabled,
  publicSiteOrigin,
}: {
  readonly content: ContentSnapshot;
  readonly hasErrors: boolean;
  readonly status: string;
  readonly publishState: PublishState;
  readonly publishProgress: PublishProgress | null;
  readonly hasPublishUrl: boolean;
  readonly onSaveDraft: () => void;
  readonly onPublish: () => void;
  readonly disabled: boolean;
  readonly publicSiteOrigin: string;
}) => {
  const statusIsError = hasErrors || publishState === 'error' || !hasPublishUrl;
  const targetVersion = publishProgress?.targetVersion ?? content.settings.siteVersion ?? content.version;
  const liveUrl = publishProgress?.liveUrl ?? publicSiteOrigin;
  const checkedAt = publishProgress?.checkedAt ? formatPublishTime(publishProgress.checkedAt) : null;
  const bundleFile = publishProgress?.lastBundleUrl ? getBundleFileName(publishProgress.lastBundleUrl) : null;

  return (
    <section className="workspace-panel publish-panel-detail">
      <PanelHeader title="פרסום ושינויים" text="כאן עושים בדיקה אחרונה. שמירה לבד לא משנה את האתר; עדכון אתר מפרסם את הכל." />
      <div className="publish-flow">
        {getPublishSteps(publishState, hasErrors, hasPublishUrl).map(({ step, title, text, state }) => (
          <article className={`is-${state}`} key={step}>
            <strong>{step}</strong>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className={statusIsError ? 'publish-summary is-error' : 'publish-summary'}>
        <ShieldAlert aria-hidden="true" />
        <div>
          <span>{!hasPublishUrl ? 'חסר חיבור פרסום מאובטח. צריך להגדיר את כתובת הפרסום של Apps Script בסביבת הסטודיו.' : status}</span>
          <div className="publish-status-details" aria-label="פרטי פרסום">
            <span>גרסה לפרסום: {targetVersion}</span>
            <a href={liveUrl} target="_blank" rel="noreferrer">אתר חי: {liveUrl.replace('https://', '')}</a>
            {publishProgress?.attempt && <span>בדיקה: {publishProgress.attempt}/{publishProgress.totalAttempts}</span>}
            {checkedAt && <span>נבדק לאחרונה: {checkedAt}</span>}
            {bundleFile && <span>קובץ אתר שנבדק: {bundleFile}</span>}
          </div>
        </div>
      </div>
      <div className="overview-strip">
        <Metric label="שירותים לא בארכיון" value={String(content.services.filter((item) => !item.deletedAt).length)} />
        <Metric label="שאלות FAQ פעילות" value={String(content.sections.filter((item) => item.group === 'faq' && item.active && !item.deletedAt).length)} />
        <Metric label="תמונות פעילות" value={String(content.gallery.filter((item) => item.active && !item.deletedAt).length)} />
        <Metric label="גרסה לפרסום" value={targetVersion} />
      </div>
      <OwnerVerificationPanel
        publishState={publishState}
        hasErrors={hasErrors}
        hasPublishUrl={hasPublishUrl}
        liveUrl={liveUrl}
      />
      <div className="topbar-actions">
        <button className="ghost-button" onClick={onSaveDraft} disabled={disabled}>
          <Save aria-hidden="true" />
          שמור כטיוטה
        </button>
        <button className="publish-button" onClick={onPublish} disabled={disabled || !hasPublishUrl}>
          <Rocket aria-hidden="true" />
          עדכן אתר
        </button>
        <a className="ghost-link" href={publicSiteOrigin} target="_blank" rel="noreferrer">פתיחת האתר החי</a>
      </div>
    </section>
  );
};

export const OwnerVerificationPanel = ({
  publishState,
  hasErrors,
  hasPublishUrl,
  liveUrl,
}: {
  readonly publishState: PublishState;
  readonly hasErrors: boolean;
  readonly hasPublishUrl: boolean;
  readonly liveUrl: string;
}) => (
  <section className="owner-verification-panel" aria-label="בדיקות בעלים בפרודקשיין">
    <div className="owner-verification-heading">
      <div>
        <p className="kicker">בדיקות בעלים בפרודקשיין</p>
        <h3>מה לבדוק אחרי Login ולפני שסוגרים משימה</h3>
        <p>הסטודיו יכול לזהות סטטוס שמירה ופרסום. בדיקת התחברות אמיתית ושינוי תוכן בפועל עדיין צריכים להתבצע מחשבון Google מורשה.</p>
      </div>
      <a className="ghost-link" href={liveUrl} target="_blank" rel="noreferrer">
        <ExternalLink aria-hidden="true" />
        אתר חי
      </a>
    </div>
    <div className="owner-checklist">
      {getOwnerVerificationChecklist(publishState, hasErrors, hasPublishUrl).map((item) => (
        <article className={`is-${item.state}`} key={item.title}>
          {item.state === 'done' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          <div>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export const getStudioWorkflowSteps = (
  activeView: ActiveView,
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly StudioWorkflowStep[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'עריכה', text: 'יש שדה שצריך לתקן', state: 'error' },
      { step: '2', title: 'תצוגה מקדימה', text: 'אפשר לבדוק מה השתנה', state: activeView === 'site-map' ? 'pending' : 'active' },
      { step: '3', title: 'שמירת טיוטה', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'עדכון האתר', text: 'חסום עד שאין שגיאות', state: 'blocked' },
    ];
  }

  const isEditingView = activeView !== 'site-map' && activeView !== 'publish';
  const isPublishView = activeView === 'publish' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isSaved = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const saveIsActive = publishState === 'saving';
  const publishIsActive = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';

  return [
    {
      step: '1',
      title: 'עריכה',
      text: isEditingView ? 'כותבים ומשנים את האזור הנוכחי' : 'בחרו אזור לעריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '2',
      title: 'תצוגה מקדימה',
      text: isEditingView ? 'בדקו מחשב ומובייל לפני שמירה' : 'נפתחת בתוך כל מסך עריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '3',
      title: 'שמירת טיוטה',
      text: saveIsActive ? 'שומר עכשיו ל-Google Sheets' : isSaved ? 'הטיוטה נשמרה' : 'שומר ל-Sheets בלי לשנות את האתר',
      state: saveIsActive ? 'active' : isSaved ? 'done' : 'pending',
    },
    {
      step: '4',
      title: 'עדכון האתר',
      text: !hasPublishUrl ? 'חסר חיבור פרסום מאובטח' : publishState === 'live' ? 'האתר החי עודכן' : publishIsActive ? 'הענן בונה ובודק גרסה חיה' : 'מפרסם רק אחרי שמירה ובדיקה',
      state: !hasPublishUrl ? 'blocked' : publishState === 'live' ? 'done' : publishIsActive ? 'active' : isPublishView ? 'active' : 'pending',
    },
  ];
};

export const getOwnerVerificationChecklist = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly OwnerVerificationItem[] => {
  const hasSavedDraft = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isPublishing = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';
  const isLive = publishState === 'live';

  if (hasErrors) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: 'חסום עד שמתקנים את שגיאת התוכן שמופיעה למעלה.', state: 'blocked' },
      { title: 'פרסום אמיתי', text: 'חסום עד שהתוכן תקין ואפשר לשמור.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'תתבצע אחרי פרסום מוצלח.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
      { title: 'פרסום אמיתי', text: 'חסר חיבור פרסום מאובטח, לכן אי אפשר להפעיל עדכון אתר.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'מחכה לחיבור פרסום.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  return [
    { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
    { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
    {
      title: 'פרסום אמיתי',
      text: isLive ? 'הפרסום הסתיים והסטודיו זיהה את הגרסה באתר החי.' : isPublishing ? 'הפרסום נשלח והסטודיו עוקב אחרי האתר החי.' : 'לחצו עדכן אתר רק אחרי שמירה ובדיקת preview.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    {
      title: 'בדיקת האתר החי',
      text: isLive ? 'לפתוח את האתר ולוודא שהשינוי נראה גם ללקוח.' : isPublishing ? 'מחכה שהאתר החי יגיש את הגרסה החדשה.' : 'ייפתח אחרי פרסום אמיתי.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
  ];
};

export const getPublishSteps = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly { readonly step: string; readonly title: string; readonly text: string; readonly state: PublishStepState }[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'צריך לתקן לפני פרסום', state: 'error' },
      { step: '2', title: 'שמירה', text: 'מחכה לתיקון', state: 'blocked' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'בנייה בענן', text: 'עוד לא התחילה', state: 'pending' },
      { step: '5', title: 'האתר החי', text: 'עוד לא עודכן', state: 'pending' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'התוכן תקין לפרסום', state: 'done' },
      { step: '2', title: 'שמירה ב-Sheets', text: 'אפשר לשמור טיוטה', state: publishState === 'saving' ? 'active' : 'pending' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסר חיבור פרסום מאובטח', state: 'blocked' },
      { step: '4', title: 'Cloudflare בונה', text: 'מחכה לחיבור פרסום', state: 'pending' },
      { step: '5', title: 'האתר החי', text: 'עוד לא עודכן', state: 'pending' },
    ];
  }

  const done = (states: readonly PublishState[]) => states.includes(publishState);
  const active = (state: PublishState) => publishState === state;

  return [
    { step: '1', title: 'בדיקת שגיאות', text: 'התוכן תקין לפרסום', state: 'done' },
    {
      step: '2',
      title: 'שמירה ב-Sheets',
      text: active('saving') ? 'שומר עכשיו' : done(['draft', 'publishing', 'checking', 'published', 'live']) ? 'נשמר' : 'מוכן לשמירה',
      state: active('saving') ? 'active' : done(['draft', 'publishing', 'checking', 'published', 'live']) ? 'done' : 'pending',
    },
    {
      step: '3',
      title: 'שליחה לפרסום',
      text: active('publishing') ? 'שולח לשרת הפרסום' : done(['checking', 'published', 'live']) ? 'נשלח' : 'יחכה ללחיצה',
      state: active('publishing') ? 'active' : done(['checking', 'published', 'live']) ? 'done' : 'pending',
    },
    {
      step: '4',
      title: 'Cloudflare בונה',
      text: done(['published']) ? 'נשלח ומחכה לבנייה' : active('checking') ? 'בודק אם הגרסה כבר עלתה' : done(['live']) ? 'הסתיים' : 'יתחיל אחרי שליחה',
      state: done(['published']) || active('checking') ? 'active' : done(['live']) ? 'done' : 'pending',
    },
    {
      step: '5',
      title: 'האתר החי',
      text: active('live') ? 'הגרסה החדשה באוויר' : 'מחכה לגרסה החדשה',
      state: active('live') ? 'done' : 'pending',
    },
  ];
};
