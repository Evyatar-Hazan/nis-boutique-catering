/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import {
  audienceCards,
  brandMedia,
  boutiqueReasons,
  contactDeliveryOptions,
  contactInterestOptions,
  coordinationCards,
  editorialCards,
  faqs,
  foodMedia,
  galleryCategories,
  galleryImages,
  heroBadges,
  heroContent,
  heroMedia,
  heroSceneNotes,
  heroStats,
  manifestoMoments,
  menuGroups,
  phoneHref,
  processSteps,
  sectionCopy,
  siteMicrocopy,
  seoTopics,
  services,
  signatureMoments,
  storyMoments,
  trustCards,
  videoMedia,
} from '../../../apps/frontend/nis-boutique-catering/src/data/siteContent';

export const defaultSiteSectionPreviewData = {
  audienceCards,
  brandMedia,
  boutiqueReasons,
  contactDeliveryOptions,
  contactInterestOptions,
  coordinationCards,
  editorialCards,
  faqs,
  foodMedia,
  galleryCategories,
  galleryImages,
  heroBadges,
  heroContent,
  heroMedia,
  heroSceneNotes,
  heroStats,
  manifestoMoments,
  menuGroups,
  phoneHref,
  processSteps,
  sectionCopy,
  siteMicrocopy,
  seoTopics,
  services,
  signatureMoments,
  storyMoments,
  trustCards,
  videoMedia,
} as const;

export type SiteSectionPreviewData = typeof defaultSiteSectionPreviewData;

const SiteSectionPreviewDataContext = createContext<SiteSectionPreviewData>(defaultSiteSectionPreviewData);

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

export const useSiteSectionPreviewData = () => useContext(SiteSectionPreviewDataContext);
