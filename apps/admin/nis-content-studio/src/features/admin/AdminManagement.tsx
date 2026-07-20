import { CheckCircle2, LoaderCircle, ShieldCheck, UserPlus, UserRoundCheck, UserRoundX, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { StudioApiError } from '../../api/client';
import { studioApi } from '../../api/studioApi';
import { useStudioQuery } from '../../hooks/useStudioQuery';

const messageForError = (error: unknown) => error instanceof StudioApiError
  ? error.message
  : 'הפעולה נכשלה. אפשר לנסות שוב.';

export const AdminManagement = ({
  currentAdminId,
  onUnauthorized,
}: {
  readonly currentAdminId: string;
  readonly onUnauthorized: () => void;
}) => {
  const adminsQuery = useStudioQuery({ onUnauthorized, query: studioApi.listAdmins });
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null);
  const admins = useMemo(() => adminsQuery.data?.admins ?? [], [adminsQuery.data]);
  const activeAdminCount = useMemo(() => admins.filter((admin) => admin.isActive).length, [admins]);

  const runMutation = async (id: string, operation: () => Promise<unknown>, successMessage: string) => {
    setBusyId(id);
    setStatus(null);
    try {
      await operation();
      setConfirmDeactivateId(null);
      setStatus({ kind: 'success', text: successMessage });
      adminsQuery.reload();
    } catch (error) {
      if (error instanceof StudioApiError && error.kind === 'auth') onUnauthorized();
      setStatus({ kind: 'error', text: messageForError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const submitAdmin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runMutation('create', async () => {
      await studioApi.createAdmin({ displayName: displayName.trim(), email: email.trim() });
      setDisplayName('');
      setEmail('');
    }, 'המנהל נוסף ויכול להתחבר באמצעות חשבון Google התואם לכתובת הזו.');
  };

  return <section className="admin-management" aria-labelledby="admin-management-title">
    <div className="admin-management-heading">
      <div>
        <p className="eyebrow">גישה והרשאות</p>
        <h2 id="admin-management-title">ניהול מנהלים</h2>
        <p>הוספה, הפעלה והשבתה של בעלי גישה לסטודיו. השבתה מנתקת מיד את כל החיבורים הפעילים.</p>
      </div>
      <span className="admin-count"><ShieldCheck aria-hidden="true" />{activeAdminCount} מנהלים פעילים</span>
    </div>

    <form className="admin-create-form" onSubmit={submitAdmin}>
      <label className="field"><span>שם להצגה</span><input required maxLength={180} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="למשל: יהודית" /></label>
      <label className="field"><span>כתובת Gmail מורשית</span><input required type="email" maxLength={320} dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" /></label>
      <button className="primary-button" type="submit" disabled={busyId !== null || !displayName.trim() || !email.trim()}>
        {busyId === 'create' ? <LoaderCircle className="spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}הוסף מנהל
      </button>
    </form>

    {status && <div className={`admin-operation-status is-${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
      {status.kind === 'success' ? <CheckCircle2 aria-hidden="true" /> : <X aria-hidden="true" />}{status.text}
    </div>}

    {adminsQuery.status === 'loading' && <div className="empty-state" role="status"><LoaderCircle className="spin" aria-hidden="true" />טוענים מנהלים...</div>}
    {adminsQuery.status === 'error' && <div className="empty-state config-warning" role="alert">{adminsQuery.error.message}<button className="ghost-button" type="button" onClick={adminsQuery.reload}>נסה שוב</button></div>}
    {adminsQuery.status === 'success' && <div className="admin-list">
      {admins.map((admin) => {
        const isCurrent = admin.id === currentAdminId;
        const cannotDeactivate = isCurrent || activeAdminCount <= 1;
        const deactivationReason = isCurrent
          ? 'כדי למנוע נעילה, אי אפשר להשבית את החשבון שמחובר כרגע.'
          : activeAdminCount <= 1
            ? 'אי אפשר להשבית את המנהל הפעיל האחרון.'
            : null;
        const awaitingConfirmation = confirmDeactivateId === admin.id;
        return <article className={`admin-person-card${admin.isActive ? '' : ' is-inactive'}`} key={admin.id}>
          <div className="admin-person-identity">
            <span aria-hidden="true">{admin.displayName.trim().charAt(0)}</span>
            <div><h3>{admin.displayName}{isCurrent && <small>זה החשבון שלך</small>}</h3><p dir="ltr">{admin.email}</p></div>
          </div>
          <dl>
            <div><dt>סטטוס</dt><dd className={admin.isActive ? 'is-active' : 'is-inactive'}>{admin.isActive ? 'פעיל' : 'מושבת'}</dd></div>
            <div><dt>חיבורים פעילים</dt><dd>{admin.activeSessionCount}</dd></div>
            <div><dt>חשבון Google</dt><dd>{admin.googleSubject ? 'מקושר' : 'טרם התחבר'}</dd></div>
          </dl>
          {admin.isActive ? <div className="admin-person-actions">
            {!awaitingConfirmation && <button className="danger-button" type="button" disabled={busyId !== null || cannotDeactivate} title={deactivationReason ?? undefined} onClick={() => setConfirmDeactivateId(admin.id)}><UserRoundX aria-hidden="true" />השבת גישה</button>}
            {awaitingConfirmation && <div className="deactivation-confirm" role="alert"><p>להשבית ולנתק את כל החיבורים של {admin.displayName}?</p><button className="danger-button" type="button" disabled={busyId !== null} onClick={() => { void runMutation(admin.id, () => studioApi.updateAdmin({ id: admin.id, isActive: false }), 'הגישה הושבתה וכל החיבורים הפעילים נותקו.'); }}>{busyId === admin.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <UserRoundX aria-hidden="true" />}אשר השבתה</button><button className="ghost-button" type="button" disabled={busyId !== null} onClick={() => setConfirmDeactivateId(null)}>ביטול</button></div>}
            {deactivationReason && <small>{deactivationReason}</small>}
          </div> : <button className="ghost-button" type="button" disabled={busyId !== null} onClick={() => { void runMutation(admin.id, () => studioApi.updateAdmin({ id: admin.id, isActive: true }), 'גישת המנהל הופעלה מחדש.'); }}>{busyId === admin.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <UserRoundCheck aria-hidden="true" />}הפעל מחדש</button>}
        </article>;
      })}
    </div>}
  </section>;
};
