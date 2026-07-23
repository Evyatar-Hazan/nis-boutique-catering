import { useEffect, useRef, useState } from 'react';

const googleScript = 'https://accounts.google.com/gsi/client';

const loadGoogle = () => new Promise<void>((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${googleScript}"]`);
  const script = existing ?? document.createElement('script');
  script.addEventListener('load', () => resolve(), { once: true });
  script.addEventListener('error', () => reject(new Error('לא ניתן לטעון את Google Sign-In.')), { once: true });
  if (!existing) {
    script.async = true;
    script.src = googleScript;
    document.head.append(script);
  }
});

export const GoogleButton = ({
  onCredential,
}: {
  readonly onCredential: (credential: string) => void;
}) => {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

  useEffect(() => {
    if (!clientId || !root.current) return;
    let active = true;
    void loadGoogle().then(() => {
      if (!active || !root.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        auto_select: false,
        callback: ({ credential }) => {
          if (credential) onCredential(credential);
        },
        client_id: clientId,
      });
      root.current.replaceChildren();
      window.google.accounts.id.renderButton(root.current, {
        locale: 'he',
        shape: 'pill',
        size: 'large',
        text: 'signin_with',
        theme: 'outline',
        type: 'standard',
      });
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'הכניסה לא זמינה.');
    });
    return () => { active = false; };
  }, [clientId, onCredential]);

  if (!clientId) return <p className="notice is-error">חסר Google Client ID.</p>;
  return <div className="google-control"><div ref={root} />{error && <p role="alert">{error}</p>}</div>;
};
