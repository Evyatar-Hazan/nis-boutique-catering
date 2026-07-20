import { CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ConnectionStatus = () => {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;
  return <div className="connection-status" role="alert"><CloudOff aria-hidden="true" /><span><strong>אין כרגע חיבור לשרת.</strong> השינויים נשארים בדפדפן; אפשר לשמור או לפרסם שוב אחרי שהחיבור חוזר.</span></div>;
};
