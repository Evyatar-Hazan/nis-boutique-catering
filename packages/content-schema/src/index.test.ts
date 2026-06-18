import { describe, expect, it } from 'vitest';
import { contentSnapshotSchema, parseBoolean, sortActiveGallery, sortActiveServices, validateContentReferences } from './index';

const snapshot = {
  version: '1',
  updatedAt: '2026-06-17T00:00:00.000Z',
  settings: {
    phoneDisplay: '050-3502615',
    phoneHref: 'tel:+972503502615',
    email: 'nisboutiquecatering@gmail.com',
    whatsappBase: 'https://wa.me/972503502615',
    siteVersion: 'v0.1.2',
  },
  media: [{ id: 'tray', src: '/media/cms/tray.webp', width: 1200, height: 1600, responsive: true }],
  gallery: [
    {
      id: 'tray',
      title: 'מגש אירוח',
      alt: 'מגש אירוח מסודר',
      category: 'trays' as const,
      order: 1,
      active: true,
      tall: true,
      mediaId: 'tray',
    },
  ],
};

describe('content schema', () => {
  it('validates a complete content snapshot', () => {
    expect(contentSnapshotSchema.parse(snapshot).gallery).toHaveLength(1);
  });

  it('rejects invalid gallery categories', () => {
    expect(() =>
      contentSnapshotSchema.parse({
        ...snapshot,
        gallery: [{ ...snapshot.gallery[0], category: 'all' }],
      }),
    ).toThrow();
  });

  it('normalizes boolean sheet values', () => {
    expect(parseBoolean('כן')).toBe(true);
    expect(parseBoolean('0', true)).toBe(false);
  });

  it('sorts only active gallery rows', () => {
    expect(
      sortActiveGallery([
        { ...snapshot.gallery[0], id: 'b', order: 2, active: true },
        { ...snapshot.gallery[0], id: 'a', order: 1, active: false },
      ]).map((item) => item.id),
    ).toEqual(['b']);
  });

  it('reports gallery and service references to missing media', () => {
    expect(
      validateContentReferences({
        ...snapshot,
        gallery: [{ ...snapshot.gallery[0], mediaId: 'missing' }],
        services: [
          {
            id: 'events',
            title: 'אירועים',
            subtitle: 'בוטיק',
            description: 'תיאור',
            bestFor: 'אירוח',
            promise: 'רגוע',
            details: ['פרט'],
            cta: 'דברו איתנו',
            mediaId: 'missing-service',
            icon: 'Camera',
            active: true,
            order: 1,
          },
        ],
        sections: [],
      }),
    ).toEqual([
      'פריט הגלריה "מגש אירוח" מצביע לתמונה שלא קיימת: missing',
      'השירות "אירועים" מצביע לתמונה שלא קיימת: missing-service',
    ]);
  });

  it('ignores archived references and sorts active services', () => {
    const services = [
      {
        id: 'b',
        title: 'שירות שני',
        subtitle: 'בוטיק',
        description: 'תיאור',
        bestFor: 'אירוח',
        promise: 'רגוע',
        details: ['פרט'],
        cta: 'דברו איתנו',
        mediaId: 'tray',
        icon: 'Camera',
        active: true,
        order: 2,
      },
      {
        id: 'a',
        title: 'שירות ראשון',
        subtitle: 'בוטיק',
        description: 'תיאור',
        bestFor: 'אירוח',
        promise: 'רגוע',
        details: ['פרט'],
        cta: 'דברו איתנו',
        mediaId: 'tray',
        icon: 'Camera',
        active: true,
        order: 1,
      },
    ];

    expect(sortActiveServices(services).map((service) => service.id)).toEqual(['a', 'b']);
    expect(
      validateContentReferences({
        ...snapshot,
        gallery: [{ ...snapshot.gallery[0], mediaId: 'missing', deletedAt: '2026-06-18T00:00:00.000Z' }],
        services: [{ ...services[0], mediaId: 'missing', deletedAt: '2026-06-18T00:00:00.000Z' }],
        sections: [],
      }),
    ).toEqual([]);
  });
});
