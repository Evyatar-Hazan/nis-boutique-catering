import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { AppErrorBoundary } from './AppErrorBoundary';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing.');
root.dataset.application = 'nis-media-library';

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
);
