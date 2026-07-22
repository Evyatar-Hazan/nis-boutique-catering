import { useEffect, useRef, useState } from 'react';

import { studioConfig } from '../../config';

const googleScriptUrl = 'https://accounts.google.com/gsi/client';

const loadGoogleIdentity = () => new Promise<void>((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve();
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${googleScriptUrl}"]`);
  const script = existing ?? document.createElement('script');
  const onLoad = () => resolve();
  const onError = () => reject(new Error('לא ניתן לטעון את Google Sign-In.'));
  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });
  if (!existing) {
    script.async = true;
    script.src = googleScriptUrl;
    document.head.append(script);
  }
});

export const GoogleIdentityButton = ({
  disabled,
  onCredential,
}: {
  readonly disabled: boolean;
  readonly onCredential: (credential: string) => void;
}) => {
  const buttonRoot = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (disabled || !studioConfig.clientId || !buttonRoot.current) return;
    let active = true;
    void loadGoogleIdentity().then(() => {
      if (!active || !buttonRoot.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        auto_select: false,
        callback: ({ credential }) => {
          if (credential) onCredential(credential);
          else setError('Google לא החזיר אישור כניסה.');
        },
        cancel_on_tap_outside: true,
        client_id: studioConfig.clientId,
      });
      buttonRoot.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRoot.current, {
        shape: 'pill', size: 'large', text: 'signin_with', theme: 'outline', type: 'standard',
      });
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'לא ניתן לטעון כניסה.');
    });
    return () => { active = false; };
  }, [disabled, onCredential]);

  return (
    <div className="google-identity-control">
      <div ref={buttonRoot} />
      {error && <p className="config-warning" role="alert">{error}</p>}
    </div>
  );
};
