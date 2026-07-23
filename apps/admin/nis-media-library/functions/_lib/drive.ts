import { decryptSecret, encryptSecret, sha256 } from './crypto';
import { ApiError, type Principal } from './http';

const driveApi = 'https://www.googleapis.com/drive/v3';
const driveUploadApi = 'https://www.googleapis.com/upload/drive/v3';
const libraryMarker = 'nisCateringMedia';

interface DriveConnectionRow {
  readonly connected_email: string | null;
  readonly encrypted_refresh_token: string;
  readonly root_folder_id: string | null;
  readonly updated_at: number;
}

interface GoogleTokenResponse {
  readonly access_token?: string;
  readonly error?: string;
  readonly id_token?: string;
  readonly refresh_token?: string;
}

interface DriveFile {
  readonly appProperties?: Readonly<Record<string, string>>;
  readonly createdTime?: string;
  readonly description?: string;
  readonly id: string;
  readonly imageMediaMetadata?: {
    readonly height?: number;
    readonly width?: number;
  };
  readonly mimeType: string;
  readonly modifiedTime?: string;
  readonly name: string;
  readonly size?: string;
  readonly trashed?: boolean;
  readonly webViewLink?: string;
}

const driveFields = 'id,name,description,mimeType,size,createdTime,modifiedTime,trashed,webViewLink,imageMediaMetadata(width,height),appProperties';

const googleRequest = async <T>(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ApiError(
      response.status === 401 ? 503 : 502,
      'drive_request_failed',
      'Google Drive לא זמין כרגע.',
      detail.slice(0, 500),
    );
  }
  return response.json() as Promise<T>;
};

const tokenRequest = async (
  environment: Env,
  values: URLSearchParams,
): Promise<GoogleTokenResponse> => {
  values.set('client_id', environment.GOOGLE_CLIENT_ID);
  values.set('client_secret', environment.GOOGLE_CLIENT_SECRET);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: values,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  const payload = await response.json() as GoogleTokenResponse;
  if (!response.ok || payload.error) {
    throw new ApiError(502, 'drive_authorization_failed', 'חיבור Google Drive נכשל.');
  }
  return payload;
};

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const payload = token.split('.')[1];
  if (!payload) return {};
  try {
    return JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const readConnection = async (environment: Env): Promise<DriveConnectionRow> => {
  const row = await environment.DB.prepare(
    `SELECT encrypted_refresh_token, root_folder_id, connected_email, updated_at
     FROM drive_connections WHERE id = 1`,
  ).first<DriveConnectionRow>();
  if (!row) throw new ApiError(503, 'drive_not_connected', 'יש לחבר חשבון Google Drive.');
  return row;
};

const accessToken = async (environment: Env): Promise<string> => {
  const connection = await readConnection(environment);
  const refreshToken = await decryptSecret(
    connection.encrypted_refresh_token,
    environment.DRIVE_TOKEN_ENCRYPTION_KEY,
  );
  const tokens = await tokenRequest(environment, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }));
  if (!tokens.access_token) {
    throw new ApiError(503, 'drive_refresh_failed', 'חיבור Drive דורש חידוש.');
  }
  return tokens.access_token;
};

const escapeQuery = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const findFolder = async (
  token: string,
  name: string,
  parentId?: string,
): Promise<string | null> => {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    `name = '${escapeQuery(name)}'`,
    'trashed = false',
    ...(parentId ? [`'${escapeQuery(parentId)}' in parents`] : []),
  ].join(' and ');
  const url = new URL(`${driveApi}/files`);
  url.searchParams.set('q', query);
  url.searchParams.set('spaces', 'drive');
  url.searchParams.set('fields', 'files(id)');
  url.searchParams.set('pageSize', '10');
  const result = await googleRequest<{ readonly files: readonly DriveFile[] }>(url.toString(), token);
  return result.files[0]?.id ?? null;
};

const createFolder = async (
  token: string,
  name: string,
  parentId?: string,
): Promise<string> => {
  const folder = await googleRequest<DriveFile>(`${driveApi}/files?fields=id`, token, {
    body: JSON.stringify({
      mimeType: 'application/vnd.google-apps.folder',
      name,
      ...(parentId ? { parents: [parentId] } : {}),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return folder.id;
};

const ensureFolder = async (
  token: string,
  name: string,
  parentId?: string,
): Promise<string> => (await findFolder(token, name, parentId)) ?? createFolder(token, name, parentId);

const ensureRootFolder = async (
  environment: Env,
  token: string,
): Promise<string> => {
  const connection = await readConnection(environment);
  if (connection.root_folder_id) return connection.root_folder_id;
  const rootId = await ensureFolder(token, environment.DRIVE_ROOT_FOLDER_NAME || 'NIS Catering Media');
  await environment.DB.prepare(
    'UPDATE drive_connections SET root_folder_id = ?1, updated_at = unixepoch() WHERE id = 1',
  ).bind(rootId).run();
  return rootId;
};

const audit = async (
  database: D1Database,
  principal: Principal,
  action: string,
  fileId: string | null,
  detail: unknown,
): Promise<void> => {
  await database.prepare(
    `INSERT INTO media_audit_log
     (id, admin_id, action, drive_file_id, detail_json)
     VALUES (?1, ?2, ?3, ?4, ?5)`,
  ).bind(crypto.randomUUID(), principal.adminId, action, fileId, JSON.stringify(detail)).run();
};

export const createDriveAuthorization = async (
  request: Request,
  environment: Env,
  principal: Principal,
): Promise<string> => {
  if (!environment.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(503, 'drive_oauth_unconfigured', 'חסר Google Client Secret.');
  }
  const state = crypto.randomUUID() + crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await environment.DB.prepare(
    `INSERT INTO oauth_states (state_hash, admin_id, expires_at, created_at)
     VALUES (?1, ?2, ?3, ?4)`,
  ).bind(await sha256(state), principal.adminId, now + 10 * 60, now).run();
  const origin = new URL(request.url).origin;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    access_type: 'offline',
    client_id: environment.GOOGLE_CLIENT_ID,
    include_granted_scopes: 'true',
    prompt: 'consent',
    redirect_uri: `${origin}/api/drive/callback`,
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/drive.file',
    state,
  }).toString();
  return url.toString();
};

export const finishDriveAuthorization = async (
  request: Request,
  environment: Env,
): Promise<void> => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) throw new ApiError(400, 'drive_callback_invalid', 'חזרה מ־Google אינה תקינה.');
  const stateHash = await sha256(state);
  const now = Math.floor(Date.now() / 1000);
  const stateRow = await environment.DB.prepare(
    `DELETE FROM oauth_states
     WHERE state_hash = ?1 AND expires_at > ?2
     RETURNING admin_id`,
  ).bind(stateHash, now).first<{ readonly admin_id: string }>();
  if (!stateRow) throw new ApiError(400, 'drive_state_invalid', 'בקשת החיבור פגה.');

  const tokens = await tokenRequest(environment, new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${url.origin}/api/drive/callback`,
  }));
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new ApiError(400, 'drive_refresh_token_missing', 'Google לא החזיר הרשאה מתמשכת.');
  }
  const idPayload = tokens.id_token ? decodeJwtPayload(tokens.id_token) : {};
  const connectedEmail = typeof idPayload.email === 'string' ? idPayload.email : null;
  const encrypted = await encryptSecret(
    tokens.refresh_token,
    environment.DRIVE_TOKEN_ENCRYPTION_KEY,
  );
  await environment.DB.prepare(
    `INSERT INTO drive_connections
     (id, encrypted_refresh_token, connected_email, connected_by, created_at, updated_at)
     VALUES (1, ?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(id) DO UPDATE SET
       encrypted_refresh_token = excluded.encrypted_refresh_token,
       connected_email = excluded.connected_email,
       connected_by = excluded.connected_by,
       root_folder_id = NULL,
       updated_at = excluded.updated_at`,
  ).bind(encrypted, connectedEmail, stateRow.admin_id, now).run();
  await ensureRootFolder(environment, tokens.access_token);
  await audit(
    environment.DB,
    { adminId: stateRow.admin_id, displayName: '', email: '', sessionId: '' },
    'connect_drive',
    null,
    { connectedEmail },
  );
};

export const driveStatus = async (environment: Env) => {
  const row = await environment.DB.prepare(
    `SELECT connected_email, root_folder_id, updated_at
     FROM drive_connections WHERE id = 1`,
  ).first<{
    readonly connected_email: string | null;
    readonly root_folder_id: string | null;
    readonly updated_at: number;
  }>();
  return {
    connected: Boolean(row?.root_folder_id),
    connectedEmail: row?.connected_email ?? null,
    updatedAt: row?.updated_at ?? null,
  };
};

const presentFile = (file: DriveFile) => ({
  createdAt: file.createdTime ?? '',
  description: file.description ?? file.name.replace(/\.[^.]+$/u, ''),
  height: file.imageMediaMetadata?.height ?? null,
  id: file.id,
  mimeType: file.mimeType,
  modifiedAt: file.modifiedTime ?? '',
  name: file.name,
  sizeBytes: Number(file.size ?? 0),
  trashed: file.trashed ?? false,
  webViewLink: file.webViewLink ?? null,
  width: file.imageMediaMetadata?.width ?? null,
});

export const listMedia = async (environment: Env, includeTrashed: boolean) => {
  const token = await accessToken(environment);
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${driveApi}/files`);
    url.searchParams.set(
      'q',
      `appProperties has { key='${libraryMarker}' and value='true' } and trashed = ${includeTrashed ? 'true' : 'false'}`,
    );
    url.searchParams.set('fields', `nextPageToken,files(${driveFields})`);
    url.searchParams.set('orderBy', 'modifiedTime desc');
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await googleRequest<{
      readonly files: DriveFile[];
      readonly nextPageToken?: string;
    }>(url.toString(), token);
    files.push(...page.files);
    pageToken = page.nextPageToken;
  } while (pageToken);
  return files.map(presentFile);
};

const extensionFor = (fileName: string, mimeType: string): string => {
  const extension = fileName.match(/\.([a-zA-Z0-9]{2,5})$/u)?.[1]?.toLowerCase();
  if (extension) return extension;
  return ({
    'image/avif': 'avif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  } as Record<string, string>)[mimeType] ?? 'img';
};

export const mediaFileName = (description: string, fileName: string, mimeType: string): string => {
  const cleanDescription = description
    .normalize('NFC')
    .replace(/[\\/:*?"<>|]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 140);
  if (!cleanDescription) throw new ApiError(400, 'description_required', 'נדרש תיאור לתמונה.');
  return `${cleanDescription}.${extensionFor(fileName, mimeType)}`;
};

export const isManagedMedia = (file: Pick<DriveFile, 'appProperties' | 'mimeType'>): boolean =>
  file.mimeType.startsWith('image/') && file.appProperties?.[libraryMarker] === 'true';

export const uploadMedia = async (
  request: Request,
  environment: Env,
  principal: Principal,
) => {
  const contentType = request.headers.get('Content-Type')?.toLowerCase() ?? '';
  const allowed = new Set(['image/avif', 'image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(contentType)) {
    throw new ApiError(415, 'unsupported_media_type', 'אפשר להעלות JPG, PNG, WebP או AVIF.');
  }
  const size = Number(request.headers.get('Content-Length'));
  if (!Number.isFinite(size) || size <= 0 || size > 15 * 1024 * 1024) {
    throw new ApiError(413, 'image_too_large', 'גודל תמונה מרבי הוא 15MB.');
  }
  const description = decodeURIComponent(request.headers.get('X-Description-URI') ?? '').trim();
  const originalName = decodeURIComponent(request.headers.get('X-File-Name-URI') ?? '').trim();
  const name = mediaFileName(description, originalName, contentType);
  const token = await accessToken(environment);
  const root = await ensureRootFolder(environment, token);
  const date = new Date();
  const year = String(date.getUTCFullYear());
  const month = `${String(date.getUTCMonth() + 1).padStart(2, '0')} - ${date.toLocaleString('he-IL', { month: 'long', timeZone: 'UTC' })}`;
  const yearFolder = await ensureFolder(token, year, root);
  const monthFolder = await ensureFolder(token, month, yearFolder);
  const boundary = `nis-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    appProperties: { [libraryMarker]: 'true' },
    description,
    name,
    parents: [monthFolder],
  });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
    await request.arrayBuffer(),
    `\r\n--${boundary}--`,
  ]);
  const file = await googleRequest<DriveFile>(
    `${driveUploadApi}/files?uploadType=multipart&fields=${encodeURIComponent(driveFields)}`,
    token,
    {
      body,
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      method: 'POST',
    },
  );
  await audit(environment.DB, principal, 'upload', file.id, { description, name, size });
  return presentFile(file);
};

export const updateMedia = async (
  environment: Env,
  principal: Principal,
  input: { readonly description?: string; readonly id: string; readonly trashed?: boolean },
) => {
  const token = await accessToken(environment);
  const current = await googleRequest<DriveFile>(
    `${driveApi}/files/${encodeURIComponent(input.id)}?fields=${encodeURIComponent(driveFields)}`,
    token,
  );
  if (!isManagedMedia(current)) {
    throw new ApiError(404, 'media_not_found', 'התמונה לא נמצאה.');
  }
  const metadata: Record<string, unknown> = {};
  let action = input.trashed === true ? 'trash' : input.trashed === false ? 'restore' : 'rename';
  if (input.description !== undefined) {
    metadata.description = input.description.trim();
    metadata.name = mediaFileName(input.description, current.name, current.mimeType);
    metadata.appProperties = { [libraryMarker]: 'true' };
    action = 'rename';
  }
  if (input.trashed !== undefined) metadata.trashed = input.trashed;
  if (Object.keys(metadata).length === 0) {
    throw new ApiError(400, 'change_required', 'לא נשלח שינוי.');
  }
  const file = await googleRequest<DriveFile>(
    `${driveApi}/files/${encodeURIComponent(input.id)}?fields=${encodeURIComponent(driveFields)}`,
    token,
    {
      body: JSON.stringify(metadata),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    },
  );
  await audit(environment.DB, principal, action, file.id, metadata);
  return presentFile(file);
};

export const readMedia = async (
  environment: Env,
  id: string,
): Promise<Response> => {
  const token = await accessToken(environment);
  const metadata = await googleRequest<DriveFile>(
    `${driveApi}/files/${encodeURIComponent(id)}?fields=id,mimeType,name,trashed,appProperties`,
    token,
  );
  if (
    metadata.trashed ||
    !isManagedMedia(metadata)
  ) {
    throw new ApiError(404, 'media_not_found', 'התמונה לא נמצאה.');
  }
  const response = await fetch(`${driveApi}/files/${encodeURIComponent(id)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok || !response.body) {
    throw new ApiError(502, 'drive_media_failed', 'לא ניתן להציג את התמונה.');
  }
  return new Response(response.body, {
    headers: {
      'Cache-Control': 'private, max-age=300',
      'Content-Type': metadata.mimeType,
    },
  });
};
