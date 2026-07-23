import {
  ExternalLink,
  Image as ImageIcon,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { api, type MediaItem } from './api';

const formatDate = (value: string): string => value
  ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(value))
  : '';

const formatBytes = (value: number): string => {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))}KB`;
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
};

export const MediaGallery = ({
  items,
  onChange,
  showTrash,
}: {
  readonly items: readonly MediaItem[];
  readonly onChange: (item: MediaItem) => void;
  readonly showTrash: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [description, setDescription] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const renameInput = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('he');
    return normalized
      ? items.filter((item) =>
          `${item.description} ${item.name}`.toLocaleLowerCase('he').includes(normalized))
      : items;
  }, [items, query]);

  useEffect(() => {
    if (editing) renameInput.current?.focus();
  }, [editing]);

  const update = async (
    item: MediaItem,
    change: { readonly description?: string; readonly trashed?: boolean },
  ) => {
    setBusyId(item.id);
    try {
      onChange(await api.updateMedia({ id: item.id, ...change }));
      setEditing(null);
      setMessage(change.trashed === true
        ? 'התמונה הועברה לסל של Drive.'
        : change.trashed === false
          ? 'התמונה שוחזרה.'
          : 'השם והתיאור עודכנו ב־Drive.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'השינוי נכשל.');
    } finally {
      setBusyId(null);
    }
  };

  return <section className="gallery-panel" aria-labelledby="gallery-title">
    <div className="gallery-toolbar">
      <div className="section-heading">
        <span className="section-icon"><ImageIcon aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">{showTrash ? 'ניתן לשחזור' : 'Google Drive'}</p>
          <h2 id="gallery-title">{showTrash ? 'סל התמונות' : 'כל התמונות'}</h2>
        </div>
      </div>
      <label className="search-field">
        <Search aria-hidden="true" />
        <span className="sr-only">חיפוש תמונות</span>
        <input
          type="search"
          value={query}
          placeholder="חיפוש לפי שם או תיאור…"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        {query && <button type="button" aria-label="נקה חיפוש" onClick={() => setQuery('')}><X aria-hidden="true" /></button>}
      </label>
    </div>
    <div className="result-line">
      <strong>{filtered.length}</strong> {showTrash ? 'תמונות בסל' : 'תמונות בספרייה'}
      {query && <span>מתוך {items.length}</span>}
    </div>
    {filtered.length === 0
      ? <div className="empty-state"><Search aria-hidden="true" /><h3>{query ? 'לא נמצאו תמונות' : 'הספרייה עדיין ריקה'}</h3><p>{query ? 'נסו לחפש במילים אחרות.' : 'העלו את התמונה הראשונה והיא תופיע כאן.'}</p></div>
      : <div className="media-grid">
          {filtered.map((item) => <article className="media-card" key={item.id}>
            <div className="media-image">
              <img src={api.mediaFileUrl(item.id)} alt={item.description} loading="lazy" />
              <span>{formatBytes(item.sizeBytes)}</span>
            </div>
            <div className="media-copy">
              <h3>{item.description}</h3>
              <p>{formatDate(item.modifiedAt)}{item.width && item.height ? ` · ${item.width}×${item.height}` : ''}</p>
              <div className="media-actions">
                {showTrash
                  ? <button className="secondary-button" type="button" disabled={busyId === item.id} onClick={() => void update(item, { trashed: false })}><RotateCcw aria-hidden="true" />שחזור</button>
                  : <>
                      <button className="secondary-button" type="button" onClick={() => { setEditing(item); setDescription(item.description); }}><Pencil aria-hidden="true" />שינוי שם</button>
                      <button className="danger-button" type="button" disabled={busyId === item.id} onClick={() => void update(item, { trashed: true })}><Trash2 aria-hidden="true" />הסרה</button>
                    </>}
                {item.webViewLink && <a className="icon-button" href={item.webViewLink} target="_blank" rel="noreferrer" aria-label="פתיחה ב־Drive"><ExternalLink aria-hidden="true" /></a>}
              </div>
            </div>
          </article>)}
        </div>}
    <p className="inline-status" role="status" aria-live="polite">{message}</p>
    {editing && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) setEditing(null);
    }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="rename-title">
        <button className="dialog-close" type="button" aria-label="סגירה" onClick={() => setEditing(null)}><X aria-hidden="true" /></button>
        <p className="eyebrow">עדכון ב־Google Drive</p>
        <h2 id="rename-title">שינוי שם ותיאור</h2>
        <img src={api.mediaFileUrl(editing.id)} alt="" />
        <label className="field"><span>שם ברור לתמונה</span><input ref={renameInput} value={description} maxLength={140} onChange={(event) => setDescription(event.currentTarget.value)} /></label>
        <button className="primary-button" type="button" disabled={!description.trim() || busyId === editing.id} onClick={() => void update(editing, { description: description.trim() })}>שמירת השינוי</button>
      </section>
    </div>}
  </section>;
};
