import type { ContentSnapshot } from '@monorepo/content-schema';
import { describe, expect, it } from 'vitest';
import { getAreaStatus } from './areaStatusHelpers';

const baseContent: ContentSnapshot = {
  version: '1',
  updatedAt: '2026-06-29T00:00:00.000Z',
  settings: {
    phoneDisplay: '050-0000000',
    phoneHref: 'tel:+972500000000',
    email: 'studio@nisboutiquecatering.com',
    whatsappBase: 'https://wa.me/972500000000',
    siteVersion: 'draft',
  },
  media: [],
  gallery: [],
  services: [],
  sections: [],
};

describe('areaStatusHelpers', () => {
  it('reports hero and copy sections status', () => {
    expect(
      getAreaStatus('hero', {
        ...baseContent,
        sections: [{ id: 'hero', group: 'hero', title: 'Hero', items: [], active: true, order: 1 }],
      }),
    ).toBe('פעיל באתר');

    expect(
      getAreaStatus('intro-band', {
        ...baseContent,
        sections: [{ id: 'copy-intro-band', group: 'site-copy', title: 'Intro', text: 'Copy', items: [], active: true, order: 1 }],
      }),
    ).toBe('פעיל באתר');
  });

  it('reports collection counts and contact readiness', () => {
    expect(
      getAreaStatus('services', {
        ...baseContent,
        services: [{
          id: 's1',
          title: 'Service',
          subtitle: 'Sub',
          description: 'Desc',
          bestFor: 'אירוח',
          promise: 'רגוע',
          details: ['פרט'],
          cta: 'דברו איתנו',
          mediaId: 'media-1',
          icon: 'Camera',
          active: true,
          order: 1,
        }],
      }),
    ).toBe('1 שירותים פעילים');

    expect(
      getAreaStatus('contact', {
        ...baseContent,
        settings: { ...baseContent.settings, phoneDisplay: '' },
      }),
    ).toBe('חסר טלפון');
  });
});
