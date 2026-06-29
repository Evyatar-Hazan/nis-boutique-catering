import type { MediaUsageKind } from './components/editor/types';
import type { ActiveView } from './publishWorkflowHelpers';

export const getViewForUsage = (kind: MediaUsageKind): ActiveView => {
  if (kind === 'gallery') return 'media';
  if (kind === 'service') return 'services';
  if (kind === 'manifesto') return 'manifesto';
  return 'hero';
};
