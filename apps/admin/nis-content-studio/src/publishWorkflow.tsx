import { AlertTriangle, CheckCircle2, Cloud, ExternalLink, MonitorCheck, Rocket, Save, ShieldAlert } from 'lucide-react';
import type { ContentSnapshot } from '@monorepo/content-schema';
import { PanelHeader } from './components/editor/PanelHeader';
import {
  getOwnerVerificationChecklist,
  getPublishSteps,
  getStudioWorkflowSteps,
  type ActiveView,
  type PublishState,
} from './publishWorkflowHelpers';

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
