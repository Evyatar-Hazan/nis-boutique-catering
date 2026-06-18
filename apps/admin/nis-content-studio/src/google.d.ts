interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: 'consent' | '' }) => void;
}

interface GoogleAccountsOauth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
}

interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder;
  enableFeature: (feature: unknown) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setCallback: (callback: (data: { action: string; docs?: Array<{ id: string; name: string }> }) => void) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

interface GoogleDocsView {
  setIncludeFolders: (value: boolean) => GoogleDocsView;
  setMimeTypes: (value: string) => GoogleDocsView;
  setSelectFolderEnabled: (value: boolean) => GoogleDocsView;
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: GoogleAccountsOauth2;
    };
    picker?: {
      Action: { PICKED: string };
      DocsView: new () => GoogleDocsView;
      Feature: { MULTISELECT_ENABLED: string };
      PickerBuilder: new () => GooglePickerBuilder;
    };
  };
  gapi?: {
    load: (library: string, callback: () => void) => void;
  };
}
