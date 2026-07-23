/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import type { GalleryImage, ImageAsset } from './sitePreviewTypes';
import type { IconComponent } from './primitives/Cards';

export interface SectionHeadingContent {
  readonly description?: string;
  readonly eyebrow?: string;
  readonly title: string;
}

export interface ContactFormLabels {
  readonly date: string;
  readonly guests: string;
  readonly interest: string;
  readonly message: string;
  readonly name: string;
  readonly phone: string;
  readonly phoneCta: string;
}

export interface SiteSectionPreviewData {
  readonly contact: SectionHeadingContent & {
    readonly faqs: readonly {
      readonly answer: string;
      readonly id: string;
      readonly question: string;
    }[];
    readonly formLabels: ContactFormLabels;
    readonly interestOptions: readonly string[];
    readonly submitCta: {
      readonly label: string;
      readonly message: string;
    };
  };
  readonly gallery: SectionHeadingContent & {
    readonly images: readonly GalleryImage[];
  };
  readonly hero: SectionHeadingContent & {
    readonly image: ImageAsset;
    readonly primaryCta: {
      readonly label: string;
      readonly message: string;
    };
    readonly secondaryCta: {
      readonly label: string;
      readonly targetSection: 'gallery';
    };
    readonly valuePoints: readonly string[];
  };
  readonly phoneHref: string;
  readonly process: SectionHeadingContent & {
    readonly operationalNotes: readonly {
      readonly id: string;
      readonly text: string;
      readonly title: string;
    }[];
    readonly steps: readonly {
      readonly description: string;
      readonly icon: IconComponent;
      readonly id: string;
      readonly order: number;
      readonly title: string;
    }[];
  };
  readonly services: SectionHeadingContent & {
    readonly items: readonly {
      readonly active: boolean;
      readonly bestFor: string;
      readonly cta: {
        readonly label: string;
        readonly message: string;
      };
      readonly description: string;
      readonly icon: IconComponent;
      readonly id: string;
      readonly image: ImageAsset;
      readonly order: number;
      readonly title: string;
    }[];
  };
  readonly trust: SectionHeadingContent & {
    readonly image: ImageAsset;
    readonly points: readonly {
      readonly icon: IconComponent;
      readonly id: string;
      readonly text: string;
      readonly title: string;
    }[];
  };
  readonly whatsappBase: string;
}

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
