import { useCallback, useEffect, useState } from 'react';

import { studioApi, type StudioServerSession } from '../../api/studioApi';

export type ServerSessionState = 'loading' | 'signed-out' | 'authorized';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'לא ניתן להתחבר כרגע.';

export const useServerSession = () => {
  const [state, setState] = useState<ServerSessionState>('loading');
  const [session, setSession] = useState<StudioServerSession | null>(null);
  const [status, setStatus] = useState('בודקים חיבור מאובטח...');

  const expireSession = useCallback(() => {
    setSession(null);
    setState('signed-out');
    setStatus('החיבור פג. התחברו שוב כדי להמשיך; שינויים מקומיים לא נמחקו.');
  }, []);

  useEffect(() => {
    let active = true;
    void studioApi.readSession()
      .then((restored) => {
        if (!active) return;
        setSession(restored);
        setState(restored ? 'authorized' : 'signed-out');
        setStatus(restored ? 'החיבור המאובטח שוחזר.' : 'התחברו כדי לנהל את האתר.');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState('signed-out');
        setStatus(errorMessage(error));
      });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credential: string) => {
    setStatus('מאמתים את החשבון...');
    try {
      const next = await studioApi.exchangeGoogleCredential(credential);
      setSession(next);
      setState('authorized');
      setStatus('התחברת בהצלחה.');
    } catch (error) {
      setSession(null);
      setState('signed-out');
      setStatus(errorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await studioApi.logout();
      window.google?.accounts?.id?.disableAutoSelect();
      setSession(null);
      setState('signed-out');
      setStatus('התנתקת. אפשר להתחבר שוב.');
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }, []);

  return { expireSession, login, logout, session, state, status };
};
