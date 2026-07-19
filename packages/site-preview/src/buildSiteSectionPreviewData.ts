import {
  getActiveSectionsByGroup,
  getPreviewCopySection,
  getPreviewMicrocopy,
  getPreviewMicrocopyItems,
  publicHeroDefaults,
  type ContentSnapshot,
  type ImageAssetRecord,
} from '@monorepo/content-schema';
import type { ImageAsset } from './sitePreviewTypes';
import type { SiteSectionPreviewData } from './SiteSectionPreviewData';
import { fallbackSiteSectionPreviewData } from './fallbackSiteSectionPreviewData';

const resolvePreviewImage = (
  mediaById: ReadonlyMap<string, ImageAssetRecord>,
  mediaId: string | undefined,
  fallback: ImageAsset,
): ImageAsset => {
  const media = mediaId ? mediaById.get(mediaId) : null;
  if (!media?.src) {
    return fallback;
  }

  return {
    src: media.src,
    width: media.width,
    height: media.height,
    sizes: media.sizes || fallback.sizes,
    responsive: media.responsive ?? fallback.responsive,
  };
};

export const buildSiteSectionPreviewData = (
  content: ContentSnapshot,
  mediaById: ReadonlyMap<string, ImageAssetRecord>,
): SiteSectionPreviewData => {
  const defaults = fallbackSiteSectionPreviewData;
  const heroMedia = content.sections.find((section) => section.id === 'hero-media' && section.active && !section.deletedAt);
  const heroStatsSections = getActiveSectionsByGroup(content, 'hero-stats');
  const heroNoteSections = getActiveSectionsByGroup(content, 'hero-notes');
  const manifestoSections = getActiveSectionsByGroup(content, 'manifesto');
  const editorialSections = getActiveSectionsByGroup(content, 'editorial');
  const audienceSections = getActiveSectionsByGroup(content, 'audience');
  const processSections = getActiveSectionsByGroup(content, 'process');
  const storySections = getActiveSectionsByGroup(content, 'story');
  const signatureSections = getActiveSectionsByGroup(content, 'signature');
  const coordinationSections = getActiveSectionsByGroup(content, 'coordination');
  const trustSections = getActiveSectionsByGroup(content, 'trust');
  const faqSections = getActiveSectionsByGroup(content, 'faq');
  const samplesSections = getActiveSectionsByGroup(content, 'samples');
  const services = [...content.services]
    .filter((service) => service.active && !service.deletedAt)
    .sort((left, right) => left.order - right.order)
    .map((service, index) => {
      const base = defaults.services[index] ?? defaults.services[0];
      return {
        ...base,
        title: service.title,
        subtitle: service.subtitle,
        description: service.description,
        bestFor: service.bestFor,
        promise: service.promise,
        details: service.details,
        cta: service.cta,
        image: resolvePreviewImage(mediaById, service.mediaId, base.image),
      };
    });

  const galleryImages = [...content.gallery]
    .filter((item) => item.active && !item.deletedAt)
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      const fallbackImage = fallbackSiteSectionPreviewData.foodMedia.hostingTableOverview;
      return {
        title: item.title,
        alt: item.alt,
        image: resolvePreviewImage(mediaById, item.mediaId, fallbackImage),
        category: item.category as 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish',
        tall: item.tall,
      };
    });

  return {
    ...defaults,
    phoneHref: content.settings.phoneHref || defaults.phoneHref,
    heroContent: {
      eyebrow: publicHeroDefaults.eyebrow,
      title: publicHeroDefaults.title,
      kicker: publicHeroDefaults.description,
      text: publicHeroDefaults.description,
    },
    heroMedia: {
      background: resolvePreviewImage(mediaById, heroMedia?.items[0], defaults.heroMedia.background),
      primary: resolvePreviewImage(mediaById, heroMedia?.items[1], defaults.heroMedia.primary),
      side: resolvePreviewImage(mediaById, heroMedia?.items[2], defaults.heroMedia.side),
      tall: resolvePreviewImage(mediaById, heroMedia?.items[3], defaults.heroMedia.tall),
    },
    heroBadges: publicHeroDefaults.valuePoints,
    heroStats: heroStatsSections.length
      ? heroStatsSections.map((section, index) => ({
          value: section.title || defaults.heroStats[index]?.value || defaults.heroStats[0].value,
          label: section.text || defaults.heroStats[index]?.label || defaults.heroStats[0].label,
        }))
      : defaults.heroStats,
    heroSceneNotes: heroNoteSections.length
      ? heroNoteSections.map((section, index) => ({
          title: section.title || defaults.heroSceneNotes[index]?.title || defaults.heroSceneNotes[0].title,
          text: section.text || defaults.heroSceneNotes[index]?.text || defaults.heroSceneNotes[0].text,
        }))
      : defaults.heroSceneNotes,
    siteMicrocopy: {
      ...defaults.siteMicrocopy,
      heroPrimaryCta: publicHeroDefaults.primaryCta.label,
      heroSecondaryCta: publicHeroDefaults.secondaryCta.label,
      heroMicrocopy: getPreviewMicrocopy(content, 'hero-microcopy', defaults.siteMicrocopy.heroMicrocopy),
      heroShowcaseTitle: getPreviewMicrocopy(content, 'hero-showcase-title', defaults.siteMicrocopy.heroShowcaseTitle),
      heroShowcaseText: getPreviewMicrocopy(content, 'hero-showcase-text', defaults.siteMicrocopy.heroShowcaseText),
      heroVideoChip: getPreviewMicrocopy(content, 'hero-video-chip', defaults.siteMicrocopy.heroVideoChip),
      topbarWhatsappLabel: getPreviewMicrocopy(content, 'topbar-whatsapp-label', defaults.siteMicrocopy.topbarWhatsappLabel),
      galleryAllLabel: getPreviewMicrocopy(content, 'gallery-all-label', defaults.siteMicrocopy.galleryAllLabel),
      galleryTablesLabel: getPreviewMicrocopy(content, 'gallery-tables-label', defaults.siteMicrocopy.galleryTablesLabel),
      galleryTraysLabel: getPreviewMicrocopy(content, 'gallery-trays-label', defaults.siteMicrocopy.galleryTraysLabel),
      gallerySaladsLabel: getPreviewMicrocopy(content, 'gallery-salads-label', defaults.siteMicrocopy.gallerySaladsLabel),
      galleryCoffeeLabel: getPreviewMicrocopy(content, 'gallery-coffee-label', defaults.siteMicrocopy.galleryCoffeeLabel),
      galleryFishLabel: getPreviewMicrocopy(content, 'gallery-fish-label', defaults.siteMicrocopy.galleryFishLabel),
      contactPrimaryCta: getPreviewMicrocopy(content, 'contact-primary-cta', defaults.siteMicrocopy.contactPrimaryCta),
      contactPhoneCta: getPreviewMicrocopy(content, 'contact-phone-cta', defaults.siteMicrocopy.contactPhoneCta),
      contactLocation: getPreviewMicrocopy(content, 'contact-location', defaults.siteMicrocopy.contactLocation),
      contactPromiseHeading: getPreviewMicrocopy(content, 'contact-promise-heading', defaults.siteMicrocopy.contactPromiseHeading),
      formNameLabel: getPreviewMicrocopy(content, 'form-name-label', defaults.siteMicrocopy.formNameLabel),
      formPhoneLabel: getPreviewMicrocopy(content, 'form-phone-label', defaults.siteMicrocopy.formPhoneLabel),
      formEmailLabel: getPreviewMicrocopy(content, 'form-email-label', defaults.siteMicrocopy.formEmailLabel),
      formInterestLabel: getPreviewMicrocopy(content, 'form-interest-label', defaults.siteMicrocopy.formInterestLabel),
      formDateLabel: getPreviewMicrocopy(content, 'form-date-label', defaults.siteMicrocopy.formDateLabel),
      formGuestsLabel: getPreviewMicrocopy(content, 'form-guests-label', defaults.siteMicrocopy.formGuestsLabel),
      formDeliveryLabel: getPreviewMicrocopy(content, 'form-delivery-label', defaults.siteMicrocopy.formDeliveryLabel),
      formMessageLabel: getPreviewMicrocopy(content, 'form-message-label', defaults.siteMicrocopy.formMessageLabel),
      formSubmitLabel: getPreviewMicrocopy(content, 'form-submit-label', defaults.siteMicrocopy.formSubmitLabel),
      whatsappHeroTopic: publicHeroDefaults.primaryCta.message,
    },
    galleryCategories: [
      { id: 'all', label: getPreviewMicrocopy(content, 'gallery-all-label', defaults.galleryCategories[0].label) },
      { id: 'tables', label: getPreviewMicrocopy(content, 'gallery-tables-label', defaults.galleryCategories[1].label) },
      { id: 'trays', label: getPreviewMicrocopy(content, 'gallery-trays-label', defaults.galleryCategories[2].label) },
      { id: 'salads', label: getPreviewMicrocopy(content, 'gallery-salads-label', defaults.galleryCategories[3].label) },
      { id: 'fish', label: getPreviewMicrocopy(content, 'gallery-fish-label', defaults.galleryCategories[4].label) },
      { id: 'coffee', label: getPreviewMicrocopy(content, 'gallery-coffee-label', defaults.galleryCategories[5].label) },
    ],
    contactInterestOptions: getPreviewMicrocopyItems(content, 'contact-interest-options', defaults.contactInterestOptions),
    contactDeliveryOptions: getPreviewMicrocopyItems(content, 'contact-delivery-options', defaults.contactDeliveryOptions),
    sectionCopy: {
      ...defaults.sectionCopy,
      introBand: getPreviewCopySection(content, 'intro-band', defaults.sectionCopy.introBand),
      manifesto: getPreviewCopySection(content, 'manifesto', defaults.sectionCopy.manifesto),
      editorial: getPreviewCopySection(content, 'editorial', defaults.sectionCopy.editorial),
      audience: getPreviewCopySection(content, 'audience', defaults.sectionCopy.audience),
      experienceLab: getPreviewCopySection(content, 'experience-lab', defaults.sectionCopy.experienceLab),
      signature: getPreviewCopySection(content, 'signature', defaults.sectionCopy.signature),
      process: getPreviewCopySection(content, 'process', defaults.sectionCopy.process),
      story: getPreviewCopySection(content, 'story', defaults.sectionCopy.story),
      samples: getPreviewCopySection(content, 'samples', defaults.sectionCopy.samples),
      coordination: getPreviewCopySection(content, 'coordination', defaults.sectionCopy.coordination),
      realMedia: getPreviewCopySection(content, 'real-media', defaults.sectionCopy.realMedia),
      gallery: getPreviewCopySection(content, 'gallery', defaults.sectionCopy.gallery),
      trust: getPreviewCopySection(content, 'trust', defaults.sectionCopy.trust),
      faq: getPreviewCopySection(content, 'faq', defaults.sectionCopy.faq),
      contact: getPreviewCopySection(content, 'contact', defaults.sectionCopy.contact),
    },
    manifestoMoments: manifestoSections.length
      ? manifestoSections.map((section, index) => {
          const base = defaults.manifestoMoments[index] ?? defaults.manifestoMoments[0];
          return {
            ...base,
            label: section.items[0] || base.label,
            title: section.title || base.title,
            text: section.text || base.text,
            image: resolvePreviewImage(mediaById, section.items[1], base.image),
          };
        })
      : defaults.manifestoMoments,
    editorialCards: editorialSections.length
      ? editorialSections.map((section, index) => {
          const base = defaults.editorialCards[index] ?? defaults.editorialCards[0];
          return {
            ...base,
            label: section.items[0] || base.label,
            title: section.title || base.title,
            text: section.text || base.text,
          };
        })
      : defaults.editorialCards,
    audienceCards: audienceSections.length
      ? audienceSections.map((section, index) => {
          const base = defaults.audienceCards[index] ?? defaults.audienceCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.audienceCards,
    services: services.length ? services : defaults.services,
    processSteps: processSections.length
      ? processSections.map((section, index) => {
          const base = defaults.processSteps[index] ?? defaults.processSteps[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.processSteps,
    storyMoments: storySections.length
      ? storySections.map((section, index) => {
          const base = defaults.storyMoments[index] ?? defaults.storyMoments[0];
          return { title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.storyMoments,
    signatureMoments: signatureSections.length
      ? signatureSections.map((section, index) => {
          const base = defaults.signatureMoments[index] ?? defaults.signatureMoments[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.signatureMoments,
    menuGroups: samplesSections.length
      ? samplesSections.map((section, index) => {
          const base = defaults.menuGroups[index] ?? defaults.menuGroups[0];
          return {
            ...base,
            title: section.title || base.title,
            intro: section.text || base.intro,
            items: section.items.length ? section.items : base.items,
          };
        })
      : defaults.menuGroups,
    coordinationCards: coordinationSections.length
      ? coordinationSections.map((section, index) => {
          const base = defaults.coordinationCards[index] ?? defaults.coordinationCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.coordinationCards,
    galleryImages: galleryImages.length ? galleryImages : defaults.galleryImages,
    trustCards: trustSections.length
      ? trustSections.map((section, index) => {
          const base = defaults.trustCards[index] ?? defaults.trustCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.trustCards,
    faqs: faqSections.length
      ? faqSections.map((section, index) => {
          const base = defaults.faqs[index] ?? defaults.faqs[0];
          return { question: section.title || base.question, answer: section.text || base.answer };
        })
      : defaults.faqs,
  };
};
