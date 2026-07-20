import { getPublicMediaReferenceIds, type PublicSiteDocument } from '@monorepo/content-schema';
import { Dialog } from '@monorepo/site-preview';
import { Archive, Check, FileVideo, Image, LoaderCircle, RefreshCw, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { StudioApiError } from '../../api/client';
import { studioApi, type MediaAssetDto } from '../../api/studioApi';

const acceptedTypes = new Set(['image/avif', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);

const countOpenDocumentReferences = (document: PublicSiteDocument, mediaId: string) => {
  const direct = [
    document.sections.hero.mediaId,
    document.sections.trust.mediaId,
    document.sections.gallery.videoMediaId,
    ...document.sections.services.items.map((item) => item.mediaId),
    ...document.sections.gallery.items.map((item) => item.mediaId),
  ].filter((id) => id === mediaId).length;
  const posters = document.media.filter((asset) => asset.kind === 'video' && asset.posterMediaId === mediaId).length;
  return direct + posters;
};

const mediaKind = (asset: MediaAssetDto) => asset.mimeType.startsWith('video/') ? 'video' : 'image';

export const MediaLibrary = ({
  document,
  expectedKind,
  onClose,
  onMediaMetadataChange,
  onSelect,
  onUnauthorized,
  open,
}: {
  readonly document: PublicSiteDocument;
  readonly expectedKind: 'image' | 'video' | null;
  readonly onClose: () => void;
  readonly onMediaMetadataChange: (asset: MediaAssetDto) => void;
  readonly onSelect: (asset: MediaAssetDto, posterMediaId?: string) => void;
  readonly onUnauthorized: () => void;
  readonly open: boolean;
}) => {
  const [assets, setAssets] = useState<readonly MediaAssetDto[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const activeImageIds = document.media.filter((asset) => asset.kind === 'image' && !asset.archivedAt).map((asset) => asset.id);
  const [posterMediaId, setPosterMediaId] = useState(activeImageIds[0] ?? '');

  const load = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const response = await studioApi.listMedia();
      setAssets(response.media);
      setStatus('idle');
    } catch (error) {
      const apiError = error instanceof StudioApiError ? error : null;
      if (apiError?.kind === 'auth') onUnauthorized();
      setMessage(apiError?.message ?? 'לא ניתן לטעון כרגע את ספריית המדיה.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!open) return;
    void studioApi.listMedia().then((response) => {
      setAssets(response.media);
      setStatus('idle');
    }).catch((error: unknown) => {
      const apiError = error instanceof StudioApiError ? error : null;
      if (apiError?.kind === 'auth') onUnauthorized();
      setMessage(apiError?.message ?? 'לא ניתן לטעון כרגע את ספריית המדיה.');
      setStatus('error');
    });
  }, [onUnauthorized, open]);

  const visibleAssets = useMemo(() => assets.filter((asset) => !expectedKind || mediaKind(asset) === expectedKind), [assets, expectedKind]);
  const knownReferences = new Set(getPublicMediaReferenceIds(document));

  const upload = async () => {
    if (!file || !altText.trim()) {
      setMessage('יש לבחור קובץ ולמלא תיאור ברור לפני ההעלאה.');
      return;
    }
    if (!acceptedTypes.has(file.type) || file.size <= 0 || file.size > 12 * 1024 * 1024) {
      setMessage('הקובץ אינו נתמך או גדול מ־12MB.');
      return;
    }
    setMessage('מחשבים checksum ומעלים ל־R2...');
    setUploadProgress(0);
    try {
      const response = await studioApi.uploadMedia({ altText, file, onProgress: setUploadProgress });
      setAssets((current) => [response.media, ...current.filter((asset) => asset.id !== response.media.id)]);
      setFile(null);
      setAltText('');
      setUploadProgress(100);
      setMessage('הקובץ הועלה ונבדק. אפשר לבחור בו כעת.');
    } catch (error) {
      const apiError = error instanceof StudioApiError ? error : null;
      if (apiError?.kind === 'auth') onUnauthorized();
      setMessage(apiError?.code === 'duplicate_media'
        ? 'הקובץ כבר קיים בספרייה. אפשר להשתמש בעותק הקיים.'
        : `ההעלאה נכשלה. ${apiError?.message ?? 'הקובץ נשמר מקומית ואפשר לנסות שוב.'}`);
      setUploadProgress(null);
    }
  };

  const updateAsset = async (asset: MediaAssetDto, change: { readonly altText?: string; readonly archived?: boolean }) => {
    setMessage('מעדכנים את ספריית המדיה...');
    try {
      const response = await studioApi.updateMedia({ id: asset.id, ...change });
      const merged = { ...response.media, references: asset.references };
      setAssets((current) => current.map((candidate) => candidate.id === merged.id ? merged : candidate));
      onMediaMetadataChange(merged);
      setEditingId(null);
      setMessage(change.archived === true ? 'המדיה הועברה לארכיון.' : change.archived === false ? 'המדיה שוחזרה.' : 'התיאור עודכן.');
    } catch (error) {
      const apiError = error instanceof StudioApiError ? error : null;
      if (apiError?.kind === 'auth') onUnauthorized();
      setMessage(apiError?.code === 'media_in_use'
        ? 'אי אפשר לארכב מדיה שנמצאת בשימוש. החליפו אותה בתוכן ושמרו קודם.'
        : apiError?.message ?? 'עדכון המדיה נכשל.');
    }
  };

  return <Dialog open={open} onClose={onClose} labelledBy="media-library-title" className="media-library-dialog" bodyClassName="is-media-library-open">
    <div className="media-library-header">
      <div><p className="eyebrow">Cloudflare R2</p><h2 id="media-library-title">ספריית מדיה אחת</h2><p>מעלים, בוחרים, מעדכנים ומארכבים בלי למחוק קבצים פעילים.</p></div>
      <button className="icon-button" type="button" onClick={onClose} aria-label="סגור ספריית מדיה"><X aria-hidden="true" /></button>
    </div>

    <form className="media-upload" onSubmit={(event) => { event.preventDefault(); void upload(); }}>
      <label className="field" htmlFor="media-upload-file"><span>קובץ תמונה או וידאו</span><input id="media-upload-file" name="mediaFile" type="file" accept={[...acceptedTypes].join(',')} onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} /></label>
      <label className="field" htmlFor="media-upload-alt"><span>תיאור ברור / alt</span><input id="media-upload-alt" name="mediaAlt" value={altText} onChange={(event) => setAltText(event.currentTarget.value)} maxLength={500} /></label>
      <button className="primary-button" type="submit" disabled={uploadProgress !== null && uploadProgress < 100}><Upload aria-hidden="true" />{uploadProgress !== null && uploadProgress < 100 ? `מעלים ${uploadProgress}%` : 'העלה ל־R2'}</button>
      {uploadProgress !== null && <progress value={uploadProgress} max={100} aria-label="התקדמות העלאה">{uploadProgress}%</progress>}
    </form>

    {expectedKind === 'video' && <label className="field media-poster-field" htmlFor="media-video-poster"><span>תמונת poster לווידאו</span><select id="media-video-poster" name="mediaVideoPoster" value={posterMediaId} onChange={(event) => setPosterMediaId(event.currentTarget.value)}>{activeImageIds.map((id) => <option key={id} value={id}>{document.media.find((asset) => asset.id === id)?.title ?? id}</option>)}</select></label>}

    <div className={`media-library-status ${status === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
      {status === 'loading' ? <LoaderCircle aria-hidden="true" /> : message ? <Check aria-hidden="true" /> : null}<span>{status === 'loading' ? 'טוענים מדיה מ־R2...' : message}</span>
      {status === 'error' && <button className="ghost-button" type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" />נסה שוב</button>}
      {file && uploadProgress === null && message.includes('נכשלה') && <button className="ghost-button" type="button" onClick={() => void upload()}><RefreshCw aria-hidden="true" />נסה העלאה שוב</button>}
    </div>

    <div className="media-library-grid" aria-busy={status === 'loading'}>
      {visibleAssets.map((asset) => {
        const openReferences = countOpenDocumentReferences(document, asset.id);
        const protectedAsset = asset.references.length > 0 || openReferences > 0 || knownReferences.has(asset.id);
        const archived = asset.deletedAt !== null;
        return <article className={`media-card ${archived ? 'is-archived' : ''}`} key={asset.id}>
          <div className="media-card-preview">
            {mediaKind(asset) === 'image'
              ? <img src={studioApi.mediaFileUrl(asset.id)} alt={asset.altText || asset.originalFileName} loading="lazy" />
              : <video src={studioApi.mediaFileUrl(asset.id)} controls preload="metadata" aria-label={asset.altText || asset.originalFileName}><track kind="captions" label="ללא כתוביות" srcLang="he" /></video>}
            <span>{mediaKind(asset) === 'image' ? <Image aria-hidden="true" /> : <FileVideo aria-hidden="true" />}{asset.mimeType.replace('image/', '').replace('video/', '')}</span>
          </div>
          <div className="media-card-body">
            <strong>{asset.originalFileName}</strong>
            <small>{Math.round(asset.sizeBytes / 1024)}KB{asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}</small>
            {editingId === asset.id ? <form className="media-alt-form" onSubmit={(event) => { event.preventDefault(); if (editingAlt.trim()) void updateAsset(asset, { altText: editingAlt.trim() }); }}>
              <label className="field" htmlFor={`media-alt-${asset.id}`}><span>תיאור / alt</span><input id={`media-alt-${asset.id}`} name="mediaAltEdit" value={editingAlt} onChange={(event) => setEditingAlt(event.currentTarget.value)} /></label>
              <button className="ghost-button" type="submit">שמור תיאור</button>
            </form> : <button className="media-alt-button" type="button" onClick={() => { setEditingId(asset.id); setEditingAlt(asset.altText); }}>{asset.altText || 'הוסף תיאור'}</button>}
            <p className="media-reference-count">{openReferences} שימושים בטיוטה הפתוחה · {asset.references.length} גרסאות פעילות בשרת</p>
            <div className="media-card-actions">
              {!archived && expectedKind === mediaKind(asset) && <button
                className="primary-button"
                type="button"
                disabled={(expectedKind === 'video' && !posterMediaId) || (expectedKind === 'image' && !asset.altText.trim())}
                title={expectedKind === 'image' && !asset.altText.trim() ? 'יש למלא תיאור alt לפני שימוש באתר' : undefined}
                onClick={() => onSelect(asset, expectedKind === 'video' ? posterMediaId : undefined)}
              ><Check aria-hidden="true" />בחר / החלף</button>}
              {!archived && <button className="ghost-button" type="button" disabled={protectedAsset} title={protectedAsset ? 'יש להחליף את המדיה ולשמור את הטיוטה לפני ארכוב' : undefined} onClick={() => void updateAsset(asset, { archived: true })}><Archive aria-hidden="true" />ארכב</button>}
              {archived && <button className="ghost-button" type="button" onClick={() => void updateAsset(asset, { archived: false })}><RotateCcw aria-hidden="true" />שחזר</button>}
            </div>
          </div>
        </article>;
      })}
    </div>
  </Dialog>;
};
