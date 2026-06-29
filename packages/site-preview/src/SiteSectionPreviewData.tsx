/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import type {
  GalleryCategory,
  GalleryImage,
  ImageAsset,
} from './sitePreviewTypes';

export type SiteSectionPreviewData = {
  readonly audienceCards: readonly { readonly title: string; readonly text: string; readonly icon: React.ComponentType<any> }[];
  readonly brandMedia: Record<string, ImageAsset>;
  readonly boutiqueReasons: readonly { readonly title: string; readonly text: string; readonly icon: React.ComponentType<any> }[];
  readonly contactDeliveryOptions: readonly string[];
  readonly contactInterestOptions: readonly string[];
  readonly coordinationCards: readonly { readonly title: string; readonly text: string; readonly icon: React.ComponentType<any> }[];
  readonly editorialCards: readonly { readonly label: string; readonly title: string; readonly text: string; readonly icon: React.ComponentType<any>; readonly image: ImageAsset }[];
  readonly faqs: readonly { readonly question: string; readonly answer: string }[];
  readonly foodMedia: Record<string, ImageAsset>;
  readonly galleryCategories: readonly Readonly<{ id: GalleryCategory; label: string }>[];
  readonly galleryImages: readonly GalleryImage[];
  readonly heroBadges: readonly string[];
  readonly heroContent: { readonly eyebrow: string; readonly title: string; readonly kicker: string; readonly text: string };
  readonly heroMedia: Record<string, ImageAsset>;
  readonly heroSceneNotes: readonly { readonly title: string; readonly text: string }[];
  readonly heroStats: readonly { readonly value: string; readonly label: string }[];
  readonly manifestoMoments: readonly { readonly label: string; readonly title: string; readonly text: string; readonly image: ImageAsset }[];
  readonly menuGroups: readonly { readonly title: string; readonly intro: string; readonly items: readonly string[] }[];
  readonly phoneHref: string;
  readonly processSteps: readonly { readonly title: string; readonly text: string; readonly icon: React.ComponentType<any> }[];
  readonly sectionCopy: Record<string, { readonly eyebrow: string; readonly title: string; readonly text?: string; readonly extraText?: string }>;
  readonly siteMicrocopy: any;
  readonly seoTopics: readonly string[];
  readonly services: readonly {
    readonly title: string;
    readonly subtitle: string;
    readonly description: string;
    readonly bestFor: string;
    readonly promise: string;
    readonly details: readonly string[];
    readonly cta: string;
    readonly image: ImageAsset;
    readonly icon: React.ComponentType<any>;
  }[];
  readonly signatureMoments: readonly { readonly title: string; readonly text: string; readonly image: ImageAsset }[];
  readonly storyMoments: readonly { readonly title: string; readonly text: string }[];
  readonly trustCards: readonly { readonly title: string; readonly text: string; readonly icon: React.ComponentType<any> }[];
  readonly videoMedia: Record<string, string>;
  readonly whatsappBase: string;
};

const SiteSectionPreviewDataContext = createContext<SiteSectionPreviewData | null>(null);

export const SiteSectionPreviewDataProvider = ({
  value,
  children,
}: {
  readonly value: SiteSectionPreviewData;
  readonly children: ReactNode;
}) => (
  <SiteSectionPreviewDataContext.Provider value={value}>
    {children}
  </SiteSectionPreviewDataContext.Provider>
);

export const useSiteSectionPreviewData = () => {
  const value = useContext(SiteSectionPreviewDataContext);
  if (!value) {
    throw new Error('SiteSectionPreviewDataProvider is required');
  }
  return value;
};
