import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  App,
  ensureManagedSections,
  formatValidationIssue,
  getOwnerVerificationChecklist,
  getStudioWorkflowSteps,
  managedSectionDefaults,
} from './App';
import { exactPreviewCopySectionIds, exactPreviewSectionGroupIds, exactPreviewViewIds } from './previewParityContract';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  afterEach(() => cleanup());

  it('shows only the private login gate before authentication', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Nis Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'כניסה עם Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /תמונות וגלריה/ })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('מיני לחמניות אישיות')).not.toBeInTheDocument();
  });

  it('explains that the studio is private', () => {
    render(<App />);

    expect(screen.getByText('כניסה למורשים בלבד')).toBeInTheDocument();
    expect(screen.getByText(/רק משתמשים שאושרו מראש/)).toBeInTheDocument();
  });

  it('keeps managed section defaults aligned with public site generated content', () => {
    const requiredIds = [
      'hero',
      'hero-badges',
      'hero-marquee',
      ...[
        'intro-band',
        'manifesto',
        'editorial',
        'audience',
        'experience-lab',
        'signature',
        'process',
        'story',
        'samples',
        'coordination',
        'real-media',
        'gallery',
        'trust',
        'faq',
        'contact',
      ].map((id) => `copy-${id}`),
      ...[
        'nav-experiences-label',
        'nav-gallery-label',
        'nav-process-label',
        'nav-samples-label',
        'nav-faq-label',
        'nav-contact-label',
        'gallery-all-label',
        'gallery-tables-label',
        'gallery-trays-label',
        'gallery-salads-label',
        'gallery-fish-label',
        'gallery-coffee-label',
        'topbar-whatsapp-label',
        'footer-tagline',
        'footer-whatsapp-label',
        'studio-login-label',
        'floating-whatsapp-aria',
        'mobile-actions-aria',
        'mobile-whatsapp-label',
        'mobile-phone-label',
        'hero-primary-cta',
        'hero-secondary-cta',
        'hero-microcopy',
        'hero-showcase-title',
        'hero-showcase-text',
        'hero-video-chip',
        'experience-cta',
        'contact-primary-cta',
        'contact-phone-cta',
        'contact-location',
        'contact-promise-heading',
        'form-name-label',
        'form-phone-label',
        'form-email-label',
        'form-interest-label',
        'form-date-label',
        'form-guests-label',
        'form-delivery-label',
        'form-message-label',
        'form-submit-label',
        'whatsapp-topbar-message',
        'whatsapp-hero-topic',
        'whatsapp-contact-message',
        'whatsapp-footer-message',
        'whatsapp-floating-message',
        'contact-interest-options',
        'contact-delivery-options',
      ].map((id) => `microcopy-${id}`),
    ];
    const requiredGroups = ['editorial', 'manifesto', 'audience', 'process', 'signature', 'story', 'samples', 'coordination', 'hero-notes', 'hero-stats', 'trust', 'faq'];
    const managedIds = new Set(managedSectionDefaults.map((section) => section.id));
    const managedGroups = new Set(managedSectionDefaults.map((section) => section.group));

    expect(requiredIds.filter((id) => !managedIds.has(id))).toEqual([]);
    expect(requiredGroups.filter((group) => !managedGroups.has(group))).toEqual([]);
  });

  it('recreates missing managed sections when only archived copies exist in Sheets', () => {
    const introBand = managedSectionDefaults.find((section) => section.id === 'copy-intro-band');

    expect(introBand).toBeDefined();

    const snapshot = ensureManagedSections({
      version: 'test',
      updatedAt: '2026-06-20T00:00:00.000Z',
      settings: {
        phoneDisplay: '',
        phoneHref: 'tel:',
        email: 'studio@nisboutiquecatering.com',
        whatsappBase: 'https://wa.me/',
        siteVersion: 'draft',
      },
      media: [],
      gallery: [],
      services: [],
      sections: [
        {
          ...introBand!,
          deletedAt: '2026-06-20T00:00:00.000Z',
        },
      ],
    });

    const visibleIntroBands = snapshot.sections.filter((section) => section.id === 'copy-intro-band' && !section.deletedAt);

    expect(visibleIntroBands).toHaveLength(1);
    expect(visibleIntroBands[0]?.title).toBe(introBand?.title);
  });

  it('keeps site-copy managed sections addressable via their copy-prefixed ids', () => {
    const snapshot = ensureManagedSections({
      version: 'test',
      updatedAt: '2026-06-20T00:00:00.000Z',
      settings: {
        phoneDisplay: '',
        phoneHref: 'tel:',
        email: 'studio@nisboutiquecatering.com',
        whatsappBase: 'https://wa.me/',
        siteVersion: 'draft',
      },
      media: [],
      gallery: [],
      services: [],
      sections: [],
    });

    expect(snapshot.sections.some((section) => section.id === 'copy-intro-band' && section.group === 'site-copy')).toBe(true);
    expect(snapshot.sections.some((section) => section.id === 'copy-experience-lab' && section.group === 'site-copy')).toBe(true);
    expect(snapshot.sections.some((section) => section.id === 'copy-gallery' && section.group === 'site-copy')).toBe(true);
  });

  it('keeps the studio editing workflow clear across editing and publish states', () => {
    const editingSteps = getStudioWorkflowSteps('services', 'draft', false, true);
    const errorSteps = getStudioWorkflowSteps('faq', 'draft', true, true);
    const liveSteps = getStudioWorkflowSteps('publish', 'live', false, true);

    expect(editingSteps).toEqual([
      expect.objectContaining({ title: 'עריכה', state: 'active' }),
      expect.objectContaining({ title: 'תצוגה מקדימה', state: 'active' }),
      expect.objectContaining({ title: 'שמירת טיוטה', state: 'done' }),
      expect.objectContaining({ title: 'עדכון האתר', state: 'pending' }),
    ]);
    expect(errorSteps.at(0)).toEqual(expect.objectContaining({ title: 'עריכה', state: 'error' }));
    expect(errorSteps.at(2)).toEqual(expect.objectContaining({ title: 'שמירת טיוטה', state: 'blocked' }));
    expect(liveSteps.at(3)).toEqual(expect.objectContaining({ title: 'עדכון האתר', state: 'done', text: 'האתר החי עודכן' }));
  });

  it('guides owner production verification without bypassing login-only actions', () => {
    const blockedChecklist = getOwnerVerificationChecklist('draft', true, true);
    const liveChecklist = getOwnerVerificationChecklist('live', false, true);

    expect(blockedChecklist).toEqual([
      expect.objectContaining({ title: 'Login מורשה', state: 'done' }),
      expect.objectContaining({ title: 'שמירה אמיתית ל-Sheets', state: 'blocked' }),
      expect.objectContaining({ title: 'פרסום אמיתי', state: 'blocked' }),
      expect.objectContaining({ title: 'בדיקת האתר החי', state: 'pending' }),
      expect.objectContaining({ title: 'Refresh ושחזור Session', state: 'pending' }),
    ]);
    expect(liveChecklist).toEqual([
      expect.objectContaining({ title: 'Login מורשה', state: 'done' }),
      expect.objectContaining({ title: 'שמירה אמיתית ל-Sheets', state: 'done' }),
      expect.objectContaining({ title: 'פרסום אמיתי', state: 'done' }),
      expect.objectContaining({ title: 'בדיקת האתר החי', state: 'done' }),
      expect.objectContaining({ title: 'Refresh ושחזור Session', state: 'pending' }),
    ]);
  });

  it('shows the exact field when content validation fails', () => {
    expect(formatValidationIssue({ path: ['updatedAt'], message: 'Invalid input' })).toBe('שדה לא תקין: updatedAt - ערך לא תקין');
    expect(formatValidationIssue({ path: ['services', 0, 'title'], message: 'Too small' })).toBe('שדה לא תקין: services.0.title - Too small');
  });

  it('keeps a single exact-preview contract for all public sections that must match the site', () => {
    expect(exactPreviewViewIds).toEqual(['hero', 'intro-band', 'manifesto', 'gallery', 'contact']);
    expect(exactPreviewCopySectionIds).toEqual(['experience-lab', 'real-media']);
    expect(exactPreviewSectionGroupIds).toEqual([
      'editorial',
      'audience',
      'signature',
      'process',
      'story',
      'samples',
      'coordination',
      'trust',
      'faq',
    ]);
  });

  it('tracks exact-preview sections as managed content so the studio cannot drift silently', () => {
    const managedIds = new Set(managedSectionDefaults.map((section) => section.id));
    const managedGroups = new Set(managedSectionDefaults.map((section) => section.group));

    expect(exactPreviewCopySectionIds.every((id) => managedIds.has(`copy-${id}`))).toBe(true);
    expect(exactPreviewSectionGroupIds.every((group) => managedGroups.has(group))).toBe(true);
  });
});
