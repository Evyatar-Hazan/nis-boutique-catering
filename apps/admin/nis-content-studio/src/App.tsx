import { ServerLoginGate } from './features/auth/ServerLoginGate';
import { useServerSession } from './features/auth/useServerSession';
import { StudioSessionShell } from './features/shell/StudioSessionShell';

export const App = () => {
  const serverSession = useServerSession();
  if (serverSession.state !== 'authorized' || !serverSession.session) {
    return <ServerLoginGate state={serverSession.state} status={serverSession.status} onCredential={serverSession.login} />;
  }
  return <StudioSessionShell session={serverSession.session} onLogout={() => { void serverSession.logout(); }} />;
};
