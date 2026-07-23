import {
  CheckCircle2,
  ChefHat,
  ClipboardList,
  HeartHandshake,
  MessageCircle,
  Package,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  businessContact,
  heroImageSizes,
  type PublicGalleryCategory,
  type PublicMediaAsset,
  type PublicSiteDocument,
} from '@monorepo/content-schema';
import type {
  ContactFormLabels,
  SiteSectionPreviewData,
} from './SiteSectionPreviewData';
import type { GalleryCategory, ImageAsset } from './sitePreviewTypes';

const serviceIcons = [ChefHat, Utensils, Package] as const;
const processIcons = [MessageCircle, ClipboardList, ChefHat, CheckCircle2] as const;
const trustIcons = [Sparkles, CheckCircle2, HeartHandshake] as const;

const galleryCategoryMap: Readonly<Record<PublicGalleryCategory, GalleryCategory>> = {
  dishes: 'salads',
  tables: 'tables',
  trays: 'trays',
};

const defaultMediaUrl = (asset: PublicMediaAsset): string =>
  `/media/cms/${asset.id}.${asset.kind === 'image' ? 'webp' : 'mp4'}`;

export interface BuildSiteSectionPreviewDataOptions {
  readonly formLabels: ContactFormLabels;
  readonly resolveMediaUrl?: (asset: PublicMediaAsset) => string;
}

export const buildSiteSectionPreviewData = (
  document: PublicSiteDocument,
  {
    formLabels,
    resolveMediaUrl = defaultMediaUrl,
  }: BuildSiteSectionPreviewDataOptions,
): SiteSectionPreviewData => {
  const mediaById = new Map(document.media.map((asset) => [asset.id, asset]));
  const image = (mediaId: string, sizes: string): ImageAsset => {
    const asset = mediaById.get(mediaId);
    if (!asset || asset.kind !== 'image' || asset.archivedAt) {
      throw new Error(`Active image media is required: ${mediaId}`);
    }
    return {
      height: asset.height,
      responsive: true,
      sizes,
      src: resolveMediaUrl(asset),
      width: asset.width,
    };
  };
  const { contact, gallery, hero, process, services, trust } = document.sections;

  return {
    contact: {
      ...contact,
      formLabels,
      interestOptions: services.items
        .filter((service) => service.active)
        .sort((left, right) => left.order - right.order)
        .map((service) => service.title),
    },
    gallery: {
      ...gallery,
      images: [...gallery.items]
        .sort((left, right) => left.order - right.order)
        .map((item) => {
          const asset = mediaById.get(item.mediaId);
          if (!asset || asset.kind !== 'image' || asset.archivedAt) {
            throw new Error(`Active gallery image is required: ${item.mediaId}`);
          }
          return {
            alt: asset.alt,
            category: galleryCategoryMap[item.category],
            image: image(item.mediaId, '(max-width: 720px) 50vw, 33vw'),
            title: item.title,
          };
        }),
    },
    hero: {
      ...hero,
      image: image(hero.mediaId, heroImageSizes),
    },
    phoneHref: businessContact.phoneHref,
    process: {
      ...process,
      steps: [...process.steps]
        .sort((left, right) => left.order - right.order)
        .map((step, index) => ({
          ...step,
          icon: processIcons[index] ?? CheckCircle2,
        })),
    },
    services: {
      ...services,
      items: [...services.items]
        .sort((left, right) => left.order - right.order)
        .map((service, index) => ({
          ...service,
          description: service.summary,
          icon: serviceIcons[index] ?? Sparkles,
          image: image(service.mediaId, '(max-width: 720px) 100vw, 33vw'),
        })),
    },
    trust: {
      ...trust,
      image: image(trust.mediaId, '(max-width: 980px) 100vw, 44vw'),
      points: trust.points.map((point, index) => ({
        ...point,
        icon: trustIcons[index] ?? Sparkles,
      })),
    },
    whatsappBase: businessContact.whatsappBase,
  };
};
