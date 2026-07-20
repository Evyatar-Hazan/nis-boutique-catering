import type {
  ContentSnapshot,
  PublicSiteDocument,
} from '@monorepo/content-schema';
import { getPublicMediaReferenceIds } from '@monorepo/content-schema';

const imageSource = (id: string) => `/media/cms/${id}.webp`;
type PublicImageAsset = Extract<
  PublicSiteDocument['media'][number],
  { readonly kind: 'image' }
>;

export const adaptPublicSiteDocument = (
  document: PublicSiteDocument,
): ContentSnapshot => {
  const referencedIds = new Set(getPublicMediaReferenceIds(document));
  const referencedImages = document.media.filter(
    (asset): asset is PublicImageAsset =>
      asset.kind === 'image' && referencedIds.has(asset.id) && !asset.archivedAt,
  );
  const mediaById = new Map(document.media.map((asset) => [asset.id, asset]));
  const copySection = (
    id: string,
    section: { readonly description?: string; readonly eyebrow?: string; readonly title: string },
  ) => ({
    active: true,
    group: 'copy',
    id: `copy-${id}`,
    items: section.eyebrow ? [section.eyebrow] : [],
    order: 0,
    text: section.description,
    title: section.title,
  });

  return {
    gallery: document.sections.gallery.items.map((item) => {
      const media = mediaById.get(item.mediaId);
      return {
        active: true,
        alt: media?.kind === 'image' ? media.alt : item.title,
        category: item.category === 'dishes' ? 'salads' : item.category,
        id: item.id,
        mediaId: item.mediaId,
        order: item.order,
        tall: false,
        title: item.title,
      };
    }),
    media: referencedImages.map((asset) => ({
      height: asset.height,
      id: asset.id,
      responsive: true,
      sizes: '(max-width: 720px) 100vw, 50vw',
      src: imageSource(asset.id),
      title: asset.title,
      width: asset.width,
    })),
    sections: [
      copySection('services', document.sections.services),
      copySection('gallery', document.sections.gallery),
      copySection('process', document.sections.process),
      copySection('trust', document.sections.trust),
      copySection('faq', document.sections.contact),
      copySection('contact', document.sections.contact),
      {
        active: true,
        group: 'hero-media',
        id: 'hero-media',
        items: [document.sections.hero.mediaId],
        order: 0,
      },
      ...document.sections.process.steps.map((step) => ({
        active: true,
        group: 'process',
        id: step.id,
        items: ['CheckCircle2'],
        order: step.order,
        text: step.description,
        title: step.title,
      })),
      ...document.sections.trust.points.map((point, index) => ({
        active: true,
        group: 'trust',
        id: point.id,
        items: ['Sparkles'],
        order: index + 1,
        text: point.text,
        title: point.title,
      })),
      ...document.sections.contact.faqs.map((faq, index) => ({
        active: true,
        group: 'faq',
        id: faq.id,
        items: [],
        order: index + 1,
        text: faq.answer,
        title: faq.question,
      })),
    ],
    services: document.sections.services.items.map((service) => ({
      active: service.active,
      bestFor: service.bestFor,
      cta: service.cta.label,
      description: service.summary,
      details: [],
      icon: ['ChefHat', 'Utensils', 'Package'][service.order - 1] ?? 'Sparkles',
      id: service.id,
      mediaId: service.mediaId,
      order: service.order,
      promise: service.summary,
      subtitle: service.summary,
      title: service.title,
    })),
    settings: {
      email: document.settings.email,
      phoneDisplay: document.settings.phoneDisplay,
      phoneHref: document.settings.phoneHref,
      seoDescription: document.settings.seoDescription,
      seoTitle: document.settings.seoTitle,
      siteVersion: document.version,
      whatsappBase: document.settings.whatsappBase,
    },
    updatedAt: document.updatedAt,
    version: document.version,
  };
};
