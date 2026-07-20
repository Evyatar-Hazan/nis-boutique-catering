import { publicSiteDocumentSchema, type PublicMediaAsset, type PublicSiteDocument } from '@monorepo/content-schema';
import { PublicSiteDocumentPreview } from '@monorepo/site-preview';
import { AlertTriangle, Check, Eye, Images, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { StudioApiError } from '../../api/client';
import { studioApi, type ContentRevisionDto, type MediaAssetDto } from '../../api/studioApi';
import { MediaLibrary } from '../media/MediaLibrary';
import {
  buildEditorGroups,
  editableSectionIds,
  readEditorValue,
  sectionLabels,
  updateEditorValue,
  type EditableSectionId,
  type EditorField,
} from './contentEditorModel';

type SaveState =
  | { readonly status: 'idle' | 'saved'; readonly message: string }
  | { readonly status: 'saving'; readonly message: string }
  | { readonly status: 'error' | 'conflict'; readonly message: string };

const mapValidationErrors = (document: PublicSiteDocument): Readonly<Record<string, string>> => {
  const result = publicSiteDocumentSchema.safeParse(document);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
};

const FieldControl = ({
  error,
  field,
  onChange,
  onOpenMedia,
  value,
}: {
  readonly error?: string;
  readonly field: EditorField;
  readonly onChange: (value: string | boolean) => void;
  readonly onOpenMedia: (field: EditorField) => void;
  readonly value: string | boolean;
}) => {
  const id = `content-${field.path.replaceAll('.', '-')}`;
  const common = { 'aria-describedby': error ? `${id}-error` : undefined, 'aria-invalid': Boolean(error), id, name: field.path };
  if (field.kind === 'checkbox') return <label className="toggle-field" htmlFor={id}>
    <span>{field.label}</span><input {...common} checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.currentTarget.checked)} />
    {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
  </label>;
  return <div className="field">
    <label htmlFor={id}>{field.label}</label>
    {field.kind === 'textarea' && <textarea {...common} rows={4} value={String(value)} onChange={(event) => onChange(event.currentTarget.value)} />}
    {(field.kind === 'select' || field.kind === 'media') && <select {...common} value={String(value)} onChange={(event) => onChange(event.currentTarget.value)}>
      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>}
    {field.kind === 'media' && <button className="media-picker-button" type="button" onClick={() => onOpenMedia(field)}><Images aria-hidden="true" />פתח ספריית מדיה</button>}
    {field.kind === 'text' && <input {...common} value={String(value)} onChange={(event) => onChange(event.currentTarget.value)} />}
    {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
  </div>;
};

export const ContentStudio = ({
  initialRevision,
  onReload,
  onUnauthorized,
}: {
  readonly initialRevision: ContentRevisionDto;
  readonly onReload: () => void;
  readonly onUnauthorized: () => void;
}) => {
  const [activeSection, setActiveSection] = useState<EditableSectionId>('hero');
  const [revision, setRevision] = useState(initialRevision);
  const [savedContent, setSavedContent] = useState(initialRevision.content);
  const [content, setContent] = useState(initialRevision.content);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', message: 'כל השינויים נשמרו.' });
  const [mediaField, setMediaField] = useState<EditorField | null>(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(savedContent), [content, savedContent]);
  const validationErrors = useMemo(() => mapValidationErrors(content), [content]);
  const groups = useMemo(() => buildEditorGroups(content, activeSection), [activeSection, content]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (field: EditorField, value: string | boolean) => {
    setContent((current) => updateEditorValue(current, field.path, value));
    setSaveState({ status: 'idle', message: 'יש שינויים שלא נשמרו.' });
  };

  const openMediaLibrary = (field?: EditorField) => {
    setMediaField(field ?? null);
    setMediaLibraryOpen(true);
  };
  const closeMediaLibrary = useCallback(() => setMediaLibraryOpen(false), []);

  const mediaTitle = (fileName: string) => fileName.replace(/\.[^.]+$/u, '').replaceAll(/[-_]+/gu, ' ').trim().slice(0, 180) || 'מדיה חדשה';
  const toPublicMediaAsset = (asset: MediaAssetDto, posterMediaId?: string): PublicMediaAsset => {
    if (asset.mimeType.startsWith('video/')) {
      if (!posterMediaId || (asset.mimeType !== 'video/mp4' && asset.mimeType !== 'video/webm')) throw new Error('Video poster is required.');
      return {
        checksum: asset.sha256Hex, id: asset.id, kind: 'video', mimeType: asset.mimeType,
        objectKey: asset.objectKey, posterMediaId, sizeBytes: asset.sizeBytes, title: mediaTitle(asset.originalFileName),
        ...(asset.deletedAt ? { archivedAt: new Date(asset.deletedAt * 1000).toISOString() } : {}),
      };
    }
    if (!asset.width || !asset.height || !['image/avif', 'image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType)) throw new Error('Image metadata is incomplete.');
    return {
      alt: asset.altText, checksum: asset.sha256Hex, height: asset.height, id: asset.id, kind: 'image',
      mimeType: asset.mimeType as 'image/avif' | 'image/jpeg' | 'image/png' | 'image/webp', objectKey: asset.objectKey,
      sizeBytes: asset.sizeBytes, title: mediaTitle(asset.originalFileName), width: asset.width,
      ...(asset.deletedAt ? { archivedAt: new Date(asset.deletedAt * 1000).toISOString() } : {}),
    };
  };

  const selectMedia = (asset: MediaAssetDto, posterMediaId?: string) => {
    if (!mediaField) return;
    const publicAsset = toPublicMediaAsset(asset, posterMediaId);
    setContent((current) => {
      const withAsset = { ...current, media: [...current.media.filter((candidate) => candidate.id !== publicAsset.id), publicAsset] };
      return updateEditorValue(withAsset, mediaField.path, publicAsset.id);
    });
    setSaveState({ status: 'idle', message: 'המדיה הוחלפה בטיוטה. יש לשמור את השינוי.' });
    closeMediaLibrary();
  };

  const syncMediaMetadata = (asset: MediaAssetDto) => {
    setContent((current) => ({
      ...current,
      media: current.media.map((candidate) => candidate.id !== asset.id ? candidate : {
        ...candidate,
        ...(candidate.kind === 'image' ? { alt: asset.altText } : {}),
        ...(asset.deletedAt ? { archivedAt: new Date(asset.deletedAt * 1000).toISOString() } : { archivedAt: undefined }),
      }),
    }));
  };

  const save = async () => {
    setAttemptedSave(true);
    const candidate = { ...content, updatedAt: new Date().toISOString() };
    const parsed = publicSiteDocumentSchema.safeParse(candidate);
    if (!parsed.success) {
      setContent(candidate);
      setSaveState({ status: 'error', message: 'יש שדות שדורשים תיקון לפני השמירה.' });
      return;
    }
    setSaveState({ status: 'saving', message: 'שומרים טיוטה מאובטחת...' });
    try {
      const response = await studioApi.saveDraft({ content: parsed.data, expectedVersion: revision.version });
      if (!response.revision) throw new Error('Draft response is missing a revision.');
      setRevision(response.revision);
      setSavedContent(response.revision.content);
      setContent(response.revision.content);
      setAttemptedSave(false);
      setSaveState({ status: 'saved', message: `טיוטה גרסה ${response.revision.version} נשמרה.` });
    } catch (error) {
      const apiError = error instanceof StudioApiError ? error : null;
      if (apiError?.kind === 'auth') onUnauthorized();
      setSaveState(apiError?.kind === 'conflict'
        ? { status: 'conflict', message: 'הטיוטה השתנתה במקום אחר. טענו את גרסת השרת לפני שמירה נוספת.' }
        : { status: 'error', message: apiError?.message ?? 'השמירה נכשלה. השינויים נשארו בדפדפן.' });
    }
  };

  return <section className="content-studio" aria-labelledby="content-studio-title">
    <div className="content-command-bar">
      <div>
        <p className="eyebrow">עריכת האתר</p>
        <h2 id="content-studio-title">שישה חלקים, מקור תוכן אחד</h2>
        <p>עורכים, בודקים בתצוגה המקדימה ושומרים טיוטה — בלי לפרסם אוטומטית.</p>
      </div>
      <div className="publish-actions">
        <button className="ghost-button" type="button" onClick={() => openMediaLibrary()}><Images aria-hidden="true" />ספריית מדיה</button>
        {saveState.status === 'conflict' && <button className="ghost-button" type="button" onClick={onReload}><RefreshCw aria-hidden="true" />טען גרסת שרת</button>}
        <button className="primary-button" type="button" disabled={!dirty || saveState.status === 'saving'} onClick={() => void save()}>
          <Save aria-hidden="true" />{saveState.status === 'saving' ? 'שומרים...' : 'שמור טיוטה'}
        </button>
      </div>
    </div>

    <div className={`status-bar ${saveState.status === 'error' || saveState.status === 'conflict' ? 'is-error' : ''}`} role="status" aria-live="polite">
      {saveState.status === 'error' || saveState.status === 'conflict' ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}
      <span>{saveState.message}</span><small>גרסה {revision.version}</small>
    </div>

    <nav className="content-tabs" aria-label="חלקי האתר">
      {editableSectionIds.map((sectionId) => <button
        aria-current={activeSection === sectionId ? 'page' : undefined}
        className={activeSection === sectionId ? 'is-active' : ''}
        key={sectionId}
        type="button"
        onClick={() => setActiveSection(sectionId)}
      >{sectionLabels[sectionId]}</button>)}
    </nav>

    <div className="content-workspace">
      <div className="content-editor" aria-label={`עריכת ${sectionLabels[activeSection]}`}>
        {groups.map((group) => <fieldset className="edit-card" key={group.title}>
          <legend>{group.title}</legend>
          <div className="form-grid">
            {group.fields.map((editorField) => <FieldControl
              error={attemptedSave ? validationErrors[editorField.path] : undefined}
              field={editorField}
              key={editorField.path}
              onOpenMedia={openMediaLibrary}
              value={readEditorValue(content, editorField.path)}
              onChange={(value) => update(editorField, value)}
            />)}
          </div>
        </fieldset>)}
      </div>
      <aside className="content-preview" aria-labelledby="content-preview-title">
        <div className="content-preview-heading"><Eye aria-hidden="true" /><h3 id="content-preview-title">תצוגה מקדימה חיה</h3></div>
        <PublicSiteDocumentPreview document={content} resolveMediaUrl={(asset) => studioApi.mediaFileUrl(asset.id)} />
      </aside>
    </div>
    <MediaLibrary
      document={content}
      expectedKind={mediaField ? mediaField.path.endsWith('videoMediaId') ? 'video' : 'image' : null}
      open={mediaLibraryOpen}
      onClose={closeMediaLibrary}
      onMediaMetadataChange={syncMediaMetadata}
      onSelect={selectMedia}
      onUnauthorized={onUnauthorized}
    />
  </section>;
};
