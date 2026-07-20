/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import type { GalleryImage, ImageAsset } from './sitePreviewTypes';
import type { IconComponent } from './primitives/Cards';

export interface SiteMicrocopy {
  readonly navExperiencesLabel: string; readonly navGalleryLabel: string; readonly navProcessLabel: string;
  readonly navFaqLabel: string; readonly navContactLabel: string; readonly topbarWhatsappLabel: string;
  readonly footerTagline: string; readonly footerWhatsappLabel: string; readonly studioLoginLabel: string;
  readonly floatingWhatsappAria: string; readonly mobileActionsAria: string; readonly mobileWhatsappLabel: string;
  readonly mobilePhoneLabel: string; readonly heroPrimaryCta: string; readonly heroSecondaryCta: string;
  readonly heroMicrocopy: string; readonly heroShowcaseTitle: string; readonly heroShowcaseText: string;
  readonly heroVideoChip: string; readonly experienceCta: string; readonly contactPrimaryCta: string;
  readonly contactPhoneCta: string; readonly contactLocation: string; readonly contactPromiseHeading: string;
  readonly formNameLabel: string; readonly formPhoneLabel: string; readonly formEmailLabel: string;
  readonly formInterestLabel: string; readonly formDateLabel: string; readonly formGuestsLabel: string;
  readonly formDeliveryLabel: string; readonly formMessageLabel: string; readonly formSubmitLabel: string;
  readonly whatsappTopbarMessage: string; readonly whatsappHeroTopic: string; readonly whatsappContactMessage: string;
  readonly whatsappFooterMessage: string; readonly whatsappFloatingMessage: string;
}

export type SiteSectionPreviewData = {
  readonly audienceCards: readonly { readonly title: string; readonly text: string; readonly icon: IconComponent }[];
  readonly brandMedia: Record<string, ImageAsset>;
  readonly boutiqueReasons: readonly { readonly title: string; readonly text: string; readonly icon: IconComponent }[];
  readonly contactDeliveryOptions: readonly string[];
  readonly contactInterestOptions: readonly string[];
  readonly coordinationCards: readonly { readonly title: string; readonly text: string; readonly icon: IconComponent }[];
  readonly editorialCards: readonly { readonly label: string; readonly title: string; readonly text: string; readonly icon: IconComponent; readonly image: ImageAsset }[];
  readonly faqs: readonly { readonly question: string; readonly answer: string }[];
  readonly foodMedia: Record<string, ImageAsset>;
  readonly galleryImages: readonly GalleryImage[];
  readonly heroBadges: readonly string[];
  readonly heroContent: { readonly eyebrow: string; readonly title: string; readonly kicker: string; readonly text: string };
  readonly heroMedia: Record<string, ImageAsset>;
  readonly heroSceneNotes: readonly { readonly title: string; readonly text: string }[];
  readonly heroStats: readonly { readonly value: string; readonly label: string }[];
  readonly manifestoMoments: readonly { readonly label: string; readonly title: string; readonly text: string; readonly image: ImageAsset }[];
  readonly menuGroups: readonly { readonly title: string; readonly intro: string; readonly items: readonly string[] }[];
  readonly phoneHref: string;
  readonly processSteps: readonly { readonly title: string; readonly text: string; readonly icon: IconComponent }[];
  readonly sectionCopy: Record<string, { readonly eyebrow: string; readonly title: string; readonly text?: string; readonly extraText?: string }>;
  readonly siteMicrocopy: SiteMicrocopy;
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
    readonly icon: IconComponent;
  }[];
  readonly signatureMoments: readonly { readonly title: string; readonly text: string; readonly image: ImageAsset }[];
  readonly storyMoments: readonly { readonly title: string; readonly text: string }[];
  readonly trustCards: readonly { readonly title: string; readonly text: string; readonly icon: IconComponent }[];
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
