export const googleScopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export const studioConfig = {
  allowedEditors: (import.meta.env.VITE_ALLOWED_EDITORS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  driveFolderId: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID ?? '',
  sheetId: import.meta.env.VITE_GOOGLE_SHEET_ID ?? '',
  publishUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL ?? '',
};

export const isGoogleConfigured = Boolean(studioConfig.clientId && studioConfig.sheetId);
