import type { PublicSiteDocument } from '@monorepo/content-schema';
import { describe, expect, it } from 'vitest';

import { createPublicSiteDocument } from '@monorepo/content-schema/test-fixtures';
import {
  buildEditorGroups,
  editableSectionIds,
  readEditorValue,
  updateEditorValue,
} from './contentEditorModel';

const video = {
  checksum: 'video-checksum-1234567890',
  id: 'video-1',
  kind: 'video' as const,
  mimeType: 'video/mp4' as const,
  objectKey: 'videos/video-1.mp4',
  posterMediaId: 'image-1',
  sizeBytes: 200_000,
  title: 'וידאו אירוח',
};

describe('content editor model', () => {
  it('builds editable fields for every canonical section and no legacy section', () => {
    const document = createPublicSiteDocument();
    const paths = editableSectionIds.flatMap((sectionId) =>
      buildEditorGroups(document, sectionId).flatMap(({ fields }) => fields.map(({ path }) => path)),
    );

    expect(editableSectionIds).toEqual(['hero', 'services', 'gallery', 'process', 'trust', 'contact']);
    expect(paths).toEqual(expect.arrayContaining([
      'sections.hero.mediaId',
      'sections.services.items.0.active',
      'sections.gallery.items.0.category',
      'sections.process.steps.0.description',
      'sections.trust.points.0.text',
      'sections.contact.faqs.0.answer',
    ]));
    expect(paths.some((path) => /story|manifesto|audience|menu/u.test(path))).toBe(false);
  });

  it('updates nested values immutably and clears an optional video reference', () => {
    const base = createPublicSiteDocument();
    const document: PublicSiteDocument = {
      ...base,
      media: [...base.media, video],
      sections: {
        ...base.sections,
        gallery: { ...base.sections.gallery, videoMediaId: video.id },
      },
    };
    const renamed = updateEditorValue(document, 'sections.services.items.0.title', 'שם חדש');
    const cleared = updateEditorValue(document, 'sections.gallery.videoMediaId', '');

    expect(readEditorValue(renamed, 'sections.services.items.0.title')).toBe('שם חדש');
    expect(document.sections.services.items[0].title).not.toBe('שם חדש');
    expect(cleared.sections.gallery.videoMediaId).toBeUndefined();
    expect(document.sections.gallery.videoMediaId).toBe(video.id);
  });

  it('rejects an invalid editor path instead of mutating an unknown shape', () => {
    const document = createPublicSiteDocument();

    expect(() => updateEditorValue(document, 'sections.missing.title', 'שם חדש')).toThrow(
      'Editor field path is invalid: sections.missing.title',
    );
    expect(() => updateEditorValue(document, '', 'שם חדש')).toThrow(
      'Editor field path cannot be empty.',
    );
  });

  it('excludes archived media while keeping active image and video choices', () => {
    const base = createPublicSiteDocument();
    const document: PublicSiteDocument = {
      ...base,
      media: [
        { ...base.media[0], archivedAt: '2026-07-20T01:00:00.000Z' },
        ...base.media.slice(1),
        video,
      ],
    };
    const heroMedia = buildEditorGroups(document, 'hero')
      .flatMap(({ fields }) => fields)
      .find(({ path }) => path === 'sections.hero.mediaId');
    const galleryVideo = buildEditorGroups(document, 'gallery')
      .flatMap(({ fields }) => fields)
      .find(({ path }) => path === 'sections.gallery.videoMediaId');

    expect(heroMedia?.options?.map(({ value }) => value)).not.toContain('image-1');
    expect(heroMedia?.options?.map(({ value }) => value)).toContain('image-2');
    expect(galleryVideo?.options).toEqual(expect.arrayContaining([
      { label: 'ללא וידאו', value: '' },
      { label: video.title, value: video.id },
    ]));
  });
});
