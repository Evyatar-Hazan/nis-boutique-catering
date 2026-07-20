interface GoogleCredentialResponse {
  readonly credential?: string;
}

interface GoogleIdConfiguration {
  readonly auto_select?: boolean;
  readonly callback: (response: GoogleCredentialResponse) => void;
  readonly cancel_on_tap_outside?: boolean;
  readonly client_id: string;
}

interface GoogleButtonConfiguration {
  readonly shape?: 'rectangular' | 'pill';
  readonly size?: 'large' | 'medium' | 'small';
  readonly text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  readonly theme?: 'outline' | 'filled_blue' | 'filled_black';
  readonly type?: 'standard' | 'icon';
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        disableAutoSelect: () => void;
        initialize: (configuration: GoogleIdConfiguration) => void;
        renderButton: (parent: HTMLElement, configuration: GoogleButtonConfiguration) => void;
      };
    };
  };
}
