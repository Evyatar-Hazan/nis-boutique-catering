import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { makeAdminId, normalizeAdminEmail, type StudioAdminRecord } from '../../../studioAdmins';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';

interface AdminsWorkspaceProps {
  readonly admins: readonly StudioAdminRecord[];
  readonly currentEmail: string;
  readonly isBusy: boolean;
  readonly onSaveAdmins: (admins: readonly StudioAdminRecord[]) => void;
}

interface AdminFormState {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly picture: string;
  readonly active: boolean;
}

const emptyForm: AdminFormState = {
  id: '',
  email: '',
  name: '',
  picture: '',
  active: true,
};

const toFormState = (admin: StudioAdminRecord): AdminFormState => ({
  id: admin.id,
  email: admin.email,
  name: admin.name,
  picture: admin.picture ?? '',
  active: admin.active,
});

const formatAdminDate = (value: string) => {
  if (value === 'configured-env') {
    return 'מוגדר בסביבת הפרודקשן';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('he-IL');
};

export const AdminsWorkspace = ({
  admins,
  currentEmail,
  isBusy,
  onSaveAdmins,
}: AdminsWorkspaceProps) => {
  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const currentAdminEmail = normalizeAdminEmail(currentEmail);
  const sortedAdmins = useMemo(
    () => [...admins].sort((left, right) => Number(right.active) - Number(left.active) || left.name.localeCompare(right.name, 'he')),
    [admins],
  );
  const activeAdminCount = admins.filter((admin) => admin.active).length;
  const isEditing = Boolean(form.id);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
  };

  const saveForm = () => {
    const email = normalizeAdminEmail(form.email);
    if (!email || !email.includes('@')) {
      setFormError('צריך להזין אימייל תקין כדי שאדמין יוכל להתחבר עם Google.');
      return;
    }

    const duplicate = admins.find((admin) => normalizeAdminEmail(admin.email) === email && admin.id !== form.id);
    if (duplicate) {
      setFormError('האימייל הזה כבר קיים ברשימת האדמינים.');
      return;
    }

    const existingAdmin = admins.find((admin) => admin.id === form.id);
    const nextAdmin: StudioAdminRecord = {
      id: form.id || makeAdminId(email),
      email,
      name: form.name.trim() || email,
      picture: form.picture.trim() || undefined,
      active: form.active,
      createdAt: existingAdmin?.createdAt ?? new Date().toISOString(),
      lastLogin: existingAdmin?.lastLogin,
    };
    const nextAdmins = isEditing
      ? admins.map((admin) => (admin.id === form.id ? nextAdmin : admin))
      : [...admins, nextAdmin];

    onSaveAdmins(nextAdmins);
    resetForm();
  };

  const updateAdmin = (id: string, patch: Partial<StudioAdminRecord>) => {
    const target = admins.find((admin) => admin.id === id);
    if (!target) {
      return;
    }

    if (target.active && patch.active === false && activeAdminCount <= 1) {
      setFormError('חייב להישאר לפחות אדמין פעיל אחד במערכת.');
      return;
    }

    if (target.active && patch.active === false && normalizeAdminEmail(target.email) === currentAdminEmail) {
      setFormError('אי אפשר לכבות את האדמין שמחובר עכשיו.');
      return;
    }

    onSaveAdmins(admins.map((admin) => (admin.id === id ? { ...admin, ...patch } : admin)));
  };

  return (
    <section className="workspace-panel admins-workspace">
      <PanelHeader
        title="ניהול אדמינים"
        text="כאן מוסיפים אנשים שיוכלו להיכנס לסטודיו עם Google ולנהל את האתר. בשלב הזה כל האדמינים מקבלים אותן הרשאות."
        action={
          <button className="compact-button" onClick={() => setForm(emptyForm)} disabled={isBusy}>
            <UserPlus aria-hidden="true" />
            הוסף אדמין
          </button>
        }
      />

      <div className="admins-layout">
        <div className="admins-form">
          <div className="admin-form-heading">
            <ShieldCheck aria-hidden="true" />
            <div>
              <h3>{isEditing ? 'עריכת אדמין' : 'הוספת אדמין חדש'}</h3>
              <p>האימייל חייב להיות אותו חשבון Google שאיתו נכנסים לסטודיו.</p>
            </div>
          </div>

          <Field label="אימייל כניסה" help="כתובת Google מורשית, לדוגמה owner@example.com.">
            <TextInput value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          </Field>
          <Field label="שם לתצוגה" help="מופיע במסך האדמינים כדי שיהיה קל לזהות מי מורשה.">
            <TextInput value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          </Field>
          <Field label="תמונת פרופיל אופציונלית" help="אפשר להשאיר ריק. אם יש כתובת תמונה ציבורית, היא תוצג בכרטיס האדמין.">
            <TextInput value={form.picture} onChange={(value) => setForm((current) => ({ ...current, picture: value }))} />
          </Field>
          <Toggle
            checked={form.active}
            onChange={(active) => setForm((current) => ({ ...current, active }))}
            label="אדמין פעיל"
          />

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button className="publish-button" onClick={saveForm} disabled={isBusy}>
              שמור אדמין
            </button>
            <button className="ghost-button" onClick={resetForm} disabled={isBusy}>
              ביטול
            </button>
          </div>
        </div>

        <div className="admins-list" aria-label="רשימת אדמינים">
          <div className="admins-list-heading">
            <Users aria-hidden="true" />
            <div>
              <h3>אדמינים במערכת ({admins.length})</h3>
              <p>{activeAdminCount} פעילים עכשיו</p>
            </div>
          </div>

          {sortedAdmins.length === 0 ? (
            <div className="empty-state">
              <Users aria-hidden="true" />
              <strong>אין אדמינים מוגדרים</strong>
              <span>הוסיפו לפחות אדמין אחד לפני שמסתמכים על הרשאות מתוך Sheets.</span>
            </div>
          ) : (
            <div className="admin-card-grid">
              {sortedAdmins.map((admin) => {
                const isCurrentUser = normalizeAdminEmail(admin.email) === currentAdminEmail;
                return (
                  <article key={admin.id} className={admin.active ? 'admin-card' : 'admin-card is-inactive'}>
                    <div className="admin-card-header">
                      {admin.picture ? (
                        <img src={admin.picture} alt="" />
                      ) : (
                        <span>{admin.name.slice(0, 1)}</span>
                      )}
                      <div>
                        <h4>{admin.name}</h4>
                        <p>{admin.email}</p>
                      </div>
                    </div>
                    <dl>
                      <div>
                        <dt>סטטוס</dt>
                        <dd>{admin.active ? 'פעיל' : 'כבוי'}</dd>
                      </div>
                      <div>
                        <dt>נוסף</dt>
                        <dd>{formatAdminDate(admin.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>הרשאה</dt>
                        <dd>אדמין מלא</dd>
                      </div>
                    </dl>
                    <div className="admin-card-actions">
                      <button className="compact-button" onClick={() => setForm(toFormState(admin))} disabled={isBusy}>
                        ערוך
                      </button>
                      <button
                        className="compact-button danger-button"
                        onClick={() => updateAdmin(admin.id, { active: !admin.active })}
                        disabled={isBusy || (isCurrentUser && admin.active)}
                        title={isCurrentUser && admin.active ? 'אי אפשר לכבות את המשתמש שמחובר עכשיו' : undefined}
                      >
                        {admin.active ? 'כבה' : 'הפעל'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
