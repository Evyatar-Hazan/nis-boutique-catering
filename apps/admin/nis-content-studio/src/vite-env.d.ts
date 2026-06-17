/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_EDITORS?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_ID?: string;
  readonly VITE_GOOGLE_SHEET_ID?: string;
  readonly VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
