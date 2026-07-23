import { Check, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api, type Admin } from './api';

export const AdminPanel = () => {
  const [admins, setAdmins] = useState<readonly Admin[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('רק כתובות ברשימה יוכלו להיכנס.');

  useEffect(() => {
    void api.listAdmins().then(setAdmins).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'לא ניתן לטעון מורשים.');
    });
  }, []);

  const add = async () => {
    try {
      const { admin } = await api.createAdmin({ displayName, email });
      setAdmins((current) => [...current, admin]);
      setDisplayName('');
      setEmail('');
      setMessage('המשתמש נוסף. הוא יוכל להיכנס עם חשבון Google התואם לכתובת.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ההוספה נכשלה.');
    }
  };

  const toggle = async (admin: Admin) => {
    try {
      const { admin: updated } = await api.updateAdmin({ id: admin.id, isActive: !admin.isActive });
      setAdmins((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.isActive ? 'הגישה הופעלה.' : 'הגישה הושבתה.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'השינוי נכשל.');
    }
  };

  return <section className="admin-panel" aria-labelledby="admins-title">
    <div className="section-heading">
      <span className="section-icon"><Users aria-hidden="true" /></span>
      <div><p className="eyebrow">גישה מאובטחת</p><h2 id="admins-title">משתמשים מורשים</h2></div>
    </div>
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void add(); }}>
      <label className="field"><span>שם</span><input required value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} /></label>
      <label className="field"><span>אימייל Google</span><input required type="email" inputMode="email" dir="ltr" value={email} onChange={(event) => setEmail(event.currentTarget.value)} /></label>
      <button className="primary-button" type="submit"><UserPlus aria-hidden="true" />הוספת משתמש</button>
    </form>
    <div className="admin-list">
      {admins.map((admin) => <article className={!admin.isActive ? 'is-disabled' : ''} key={admin.id}>
        <span className="avatar">{admin.displayName.slice(0, 1)}</span>
        <div><h3>{admin.displayName}</h3><p dir="ltr">{admin.email}</p></div>
        <span className={`access-state ${admin.isActive ? 'is-active' : ''}`}>{admin.isActive ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{admin.isActive ? 'פעיל' : 'מושבת'}</span>
        <button className="secondary-button" type="button" onClick={() => void toggle(admin)}>{admin.isActive ? 'השבתה' : 'הפעלה'}</button>
      </article>)}
    </div>
    <p className="inline-status" role="status" aria-live="polite">{message}</p>
  </section>;
};
