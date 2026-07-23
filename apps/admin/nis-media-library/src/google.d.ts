interface GoogleCredentialResponse {
  readonly credential?: string;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        disableAutoSelect: () => void;
        initialize: (configuration: {
          readonly auto_select: boolean;
          readonly callback: (response: GoogleCredentialResponse) => void;
          readonly client_id: string;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          configuration: Readonly<Record<string, string>>,
        ) => void;
      };
    };
  };
}
