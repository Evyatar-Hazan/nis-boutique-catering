import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { useId, useState } from 'react';

import { api, type MediaItem } from './api';

interface QueueItem {
  readonly description: string;
  readonly file: File;
  readonly id: string;
  readonly progress: number;
  readonly status: 'ready' | 'uploading' | 'done' | 'error';
}

const baseDescription = (name: string): string =>
  name.replace(/\.[^.]+$/u, '').replaceAll(/[-_]+/gu, ' ').trim();

export const UploadPanel = ({
  onUploaded,
}: {
  readonly onUploaded: (items: readonly MediaItem[]) => void;
}) => {
  const inputId = useId();
  const [queue, setQueue] = useState<readonly QueueItem[]>([]);
  const [message, setMessage] = useState('אפשר לבחור כמה תמונות יחד, ולתת לכל אחת שם ברור.');
  const uploading = queue.some((item) => item.status === 'uploading');

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...files].map((file) => ({
      description: baseDescription(file.name),
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'ready' as const,
    }));
    setQueue((current) => [...current, ...next]);
  };

  const runUpload = async () => {
    const pending = queue.filter((item) => item.status === 'ready' || item.status === 'error');
    if (pending.some((item) => !item.description.trim())) {
      setMessage('צריך להוסיף תיאור לכל תמונה לפני ההעלאה.');
      return;
    }
    const completed: MediaItem[] = [];
    for (const item of pending) {
      setQueue((current) => current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, progress: 0, status: 'uploading' } : candidate));
      try {
        const media = await api.upload(item.file, item.description.trim(), (progress) => {
          setQueue((current) => current.map((candidate) =>
            candidate.id === item.id ? { ...candidate, progress } : candidate));
        });
        completed.push(media);
        setQueue((current) => current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, progress: 100, status: 'done' } : candidate));
      } catch (error) {
        setQueue((current) => current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, status: 'error' } : candidate));
        setMessage(error instanceof Error ? error.message : 'העלאת תמונה נכשלה.');
      }
    }
    if (completed.length > 0) {
      onUploaded(completed);
      setMessage(`${completed.length} תמונות נשמרו ב־Drive.`);
      setQueue((current) => current.filter((item) => item.status !== 'done'));
    }
  };

  return <section className="upload-panel" aria-labelledby="upload-title">
    <div className="section-heading">
      <span className="section-icon"><ImagePlus aria-hidden="true" /></span>
      <div><p className="eyebrow">הוספה מהירה</p><h2 id="upload-title">תמונות חדשות</h2></div>
    </div>
    <label className="drop-zone" htmlFor={inputId}>
      <Upload aria-hidden="true" />
      <strong>לחצו לבחירת תמונות</strong>
      <span>JPG, PNG, WebP או AVIF · עד 15MB לתמונה</span>
      <input
        id={inputId}
        type="file"
        accept="image/avif,image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => addFiles(event.currentTarget.files)}
      />
    </label>
    {queue.length > 0 && <div className="upload-queue">
      {queue.map((item) => <div className={`queue-row is-${item.status}`} key={item.id}>
        <img src={URL.createObjectURL(item.file)} alt="" />
        <label>
          <span>שם / תיאור לתמונה</span>
          <input
            value={item.description}
            maxLength={140}
            disabled={item.status === 'uploading'}
            onChange={(event) => setQueue((current) => current.map((candidate) =>
              candidate.id === item.id ? { ...candidate, description: event.currentTarget.value } : candidate))}
          />
        </label>
        {item.status === 'uploading'
          ? <progress value={item.progress} max="100" aria-label={`העלאת ${item.description}`} />
          : <button
              className="icon-button"
              type="button"
              aria-label={`הסר את ${item.description} מהתור`}
              onClick={() => setQueue((current) => current.filter((candidate) => candidate.id !== item.id))}
            ><Trash2 aria-hidden="true" /></button>}
      </div>)}
      <button className="primary-button" type="button" disabled={uploading} onClick={() => void runUpload()}>
        <Upload aria-hidden="true" />{uploading ? 'מעלה ל־Drive…' : `העלאת ${queue.length} תמונות`}
      </button>
    </div>}
    <p className="inline-status" role="status" aria-live="polite">{message}</p>
  </section>;
};
