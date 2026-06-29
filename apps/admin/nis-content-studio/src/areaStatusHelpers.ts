import { getManagedCopySection, type ContentSnapshot } from '@monorepo/content-schema';
import type { ActiveView } from './publishWorkflowHelpers';

export const getAreaStatus = (area: ActiveView, content: ContentSnapshot) => {
  if (area === 'hero') {
    const hero = content.sections.find((section) => section.id === 'hero' || section.group === 'hero');
    return hero?.active && !hero.deletedAt ? 'פעיל באתר' : 'כבוי או חסר';
  }
  if (['intro-band', 'experience-lab', 'real-media'].includes(area)) {
    const copySection = getManagedCopySection(content, area);
    return copySection?.active ? 'פעיל באתר' : 'כבוי או חסר';
  }
  if (area === 'services') {
    return `${content.services.filter((service) => service.active && !service.deletedAt).length} שירותים פעילים`;
  }
  if (area === 'gallery') {
    return `${content.gallery.filter((item) => item.active && !item.deletedAt).length} תמונות פעילות`;
  }
  if (area === 'media') {
    return `${content.media.filter((media) => !media.deletedAt).length} תמונות בספרייה`;
  }
  if (area === 'contact') {
    return content.settings.phoneDisplay ? `וואטסאפ ${content.settings.phoneDisplay}` : 'חסר טלפון';
  }
  if (area === 'publish') {
    return 'מוכן לבדיקה ופרסום';
  }
  const activeCount = content.sections.filter((section) => section.group === area && section.active && !section.deletedAt).length;
  return activeCount > 0 ? `${activeCount} פריטים פעילים` : 'עדיין לא מנוהל מהסטודיו';
};
