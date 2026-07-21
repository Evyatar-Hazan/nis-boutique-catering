import type { PublicSiteDocument } from '@monorepo/content-schema';
import { createPublicSiteDocument } from '@monorepo/content-schema/test-fixtures';
import { describe, expect, it } from 'vitest';

import { adaptPublicSiteDocument } from './adaptPublicSiteDocument';

const createDocument = (): PublicSiteDocument => {
  const base = createPublicSiteDocument();
  const sourceImage = base.media[0];
  if (sourceImage.kind !== 'image') throw new Error('Expected an image fixture.');
  return {
    ...base,
    media: [
      ...base.media,
      { ...sourceImage, checksum: 'checksum-unused-1234567890', id: 'unused', objectKey: 'images/unused.webp', title: 'unused' },
      { ...sourceImage, archivedAt: '2026-07-20T01:00:00.000Z', checksum: 'checksum-archived-1234567890', id: 'archived', objectKey: 'images/archived.webp', title: 'archived' },
    ],
    sections: {
      ...base.sections,
      gallery: {
        ...base.sections.gallery,
        items: base.sections.gallery.items.map((item, index) => index === 0 ? { ...item, category: 'dishes' } : item),
      },
    },
  };
};

describe('public document compatibility adapter', () => {
  it('maps only referenced active images and preserves public settings', () => {
    const document = createDocument();
    const snapshot = adaptPublicSiteDocument(document);
    const referencedIds = new Set([
      document.sections.hero.mediaId,
      ...document.sections.services.items.map(({ mediaId }) => mediaId),
      ...document.sections.gallery.items.map(({ mediaId }) => mediaId),
      document.sections.trust.mediaId,
    ]);

    expect(new Set(snapshot.media.map(({ id }) => id))).toEqual(referencedIds);
    expect(snapshot.media.every(({ src }) => src.startsWith('/media/cms/'))).toBe(true);
    expect(snapshot.settings).toEqual({
      ...document.settings,
      siteVersion: document.version,
    });
  });

  it('maps the six-section contract without reviving legacy groups', () => {
    const document = createDocument();
    const snapshot = adaptPublicSiteDocument(document);
    const groups = new Set(snapshot.sections.map(({ group }) => group));

    expect(snapshot.services.map(({ title, order }) => ({ order, title }))).toEqual(
      document.sections.services.items.map(({ order, title }) => ({ order, title })),
    );
    expect(snapshot.gallery).toHaveLength(document.sections.gallery.items.length);
    expect(snapshot.gallery.find(({ category }) => category === 'salads')).toBeDefined();
    expect(snapshot.sections.find(({ id }) => id === 'hero-media')?.items).toEqual([
      document.sections.trust.mediaId,
      document.sections.hero.mediaId,
    ]);
    expect(groups).toEqual(new Set(['copy', 'hero-media', 'process', 'trust', 'faq']));
    expect([...groups]).not.toEqual(expect.arrayContaining(['story', 'manifesto', 'audience', 'menu']));
  });
});
