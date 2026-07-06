import { useCallback, useEffect, useState } from 'react';
import { fetchGoogleUserEmail, requestGoogleAccessToken, type GoogleAccessToken } from '../googleApi';

export type AuthState = 'signed-out' | 'loading' | 'authorized' | 'denied';

export type StudioSession = {
  readonly accessToken: string;
  readonly email: string;
  readonly expiresAt: number;
};

type RememberedStudioSession = Omit<StudioSession, 'accessToken'>;

const rememberedSessionKey = 'nis-content-studio-session-v2';
const legacyRememberedSessionKey = 'nis-content-studio-session-v1';

const isRememberedSessionShape = (value: unknown): value is RememberedStudioSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof RememberedStudioSession, unknown>>;
  return typeof candidate.email === 'string' && typeof candidate.expiresAt === 'number';
};

const clearLegacyRememberedSession = () => {
  try {
    window.localStorage.removeItem(legacyRememberedSessionKey);
  } catch {
    // Legacy cleanup should never block the studio.
  }
};

const clearRememberedSession = () => {
  try {
    window.sessionStorage.removeItem(rememberedSessionKey);
  } catch {
    // Browser storage can be disabled; login should still work for the current tab.
  }

  clearLegacyRememberedSession();
};

const readRememberedSession = (tokenRefreshWindowMs: number) => {
  clearLegacyRememberedSession();

  try {
    const raw = window.sessionStorage.getItem(rememberedSessionKey);
    const parsed = raw ? JSON.parse(raw) as unknown : null;
    if (!isRememberedSessionShape(parsed) || parsed.expiresAt <= Date.now() + tokenRefreshWindowMs) {
      clearRememberedSession();
      return null;
    }

    return parsed;
  } catch {
    clearRememberedSession();
    return null;
  }
};

const rememberSession = (session: StudioSession) => {
  try {
    const rememberedSession: RememberedStudioSession = {
      email: session.email,
      expiresAt: session.expiresAt,
    };
    window.sessionStorage.setItem(rememberedSessionKey, JSON.stringify(rememberedSession));
  } catch {
    // Non-blocking: a private browsing policy should not prevent editing in this tab.
  }
};

type UseStudioAuthSessionArgs = {
  readonly isGoogleConfigured: boolean;
  readonly tokenRefreshWindowMs: number;
  readonly onStatusChange: (status: string) => void;
  readonly onBusyChange: (isBusy: boolean) => void;
  readonly onAuthorized: (accessToken: string, email: string) => Promise<void>;
  readonly onDenied?: () => void;
  readonly onLogout?: () => void;
};

export const useStudioAuthSession = ({
  isGoogleConfigured,
  tokenRefreshWindowMs,
  onStatusChange,
  onBusyChange,
  onAuthorized,
  onDenied,
  onLogout,
}: UseStudioAuthSessionArgs) => {
  const [authState, setAuthState] = useState<AuthState>('signed-out');
  const [session, setSession] = useState<StudioSession | null>(null);

  const loadAuthorizedSession = useCallback(async (token: GoogleAccessToken, knownEmail?: string) => {
    const email = knownEmail ?? await fetchGoogleUserEmail(token.accessToken);
    const nextSession = { accessToken: token.accessToken, email, expiresAt: token.expiresAt };
    try {
      await onAuthorized(token.accessToken, email);
      setSession(nextSession);
      rememberSession(nextSession);
      setAuthState('authorized');
      return nextSession;
    } catch (error) {
      setSession(null);
      setAuthState('signed-out');
      throw error;
    }
  }, [onAuthorized]);

  const clearSession = useCallback(() => {
    clearRememberedSession();
    setSession(null);
    setAuthState('signed-out');
    onLogout?.();
  }, [onLogout]);

  const denySession = useCallback(() => {
    clearRememberedSession();
    setSession(null);
    setAuthState('denied');
    onDenied?.();
  }, [onDenied]);

  const getFreshAccessToken = useCallback(async () => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }

    if (session.expiresAt > Date.now() + tokenRefreshWindowMs) {
      return session.accessToken;
    }

    const token = await requestGoogleAccessToken({ prompt: '' });
    const email = await fetchGoogleUserEmail(token.accessToken);
    if (email !== session.email) {
      clearSession();
      throw new Error('התחברת עם משתמש אחר. צריך להתחבר שוב כדי להמשיך.');
    }

    const nextSession = { accessToken: token.accessToken, email, expiresAt: token.expiresAt };
    setSession(nextSession);
    rememberSession(nextSession);
    return token.accessToken;
  }, [clearSession, session, tokenRefreshWindowMs]);

  useEffect(() => {
    if (!isGoogleConfigured) {
      return;
    }

    const remembered = readRememberedSession(tokenRefreshWindowMs);
    if (!remembered) {
      return;
    }

    let cancelled = false;

    const restore = async () => {
      setAuthState('loading');
      onBusyChange(true);
      onStatusChange('מחזירים אותך לסטודיו...');

      try {
        const token = await requestGoogleAccessToken({ prompt: '' });
        const email = await fetchGoogleUserEmail(token.accessToken);
        if (email !== remembered.email) {
          throw new Error('Saved Google session belongs to a different user');
        }

        await loadAuthorizedSession(token, email);

        if (!cancelled) {
          onStatusChange('החיבור הקודם חודש דרך Google. אפשר להמשיך לעבוד.');
        }
      } catch {
        clearRememberedSession();
        if (!cancelled) {
          setSession(null);
          setAuthState('signed-out');
          onStatusChange('ההתחברות הקודמת פגה. צריך להתחבר שוב עם Google.');
        }
      } finally {
        if (!cancelled) {
          onBusyChange(false);
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [isGoogleConfigured, loadAuthorizedSession, onBusyChange, onStatusChange, tokenRefreshWindowMs]);

  const handleLogin = useCallback(async () => {
    if (!isGoogleConfigured) {
      throw new Error('חסרה הגדרת Google לסטודיו. צריך להגדיר Client ID ו-Sheet ID.');
    }

    setAuthState('loading');
    const token = await requestGoogleAccessToken({ prompt: 'consent' });
    await loadAuthorizedSession(token);
  }, [isGoogleConfigured, loadAuthorizedSession]);

  const handleLogout = useCallback(() => {
    clearSession();
    onStatusChange('התנתקת מהסטודיו. אפשר להתחבר שוב עם Google.');
  }, [clearSession, onStatusChange]);

  return {
    authState,
    session,
    getFreshAccessToken,
    handleLogin,
    handleLogout,
    denySession,
    loadAuthorizedSession,
  };
};
