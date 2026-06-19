import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App, getStudioWorkflowSteps, managedSectionDefaults } from './App';
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
      'facts',
      'seo-topics',
      ...[
        'intro-band',
        'manifesto',
        'editorial',
        'audience',
        'experience-lab',
        'signature',
        'boutique',
        'services',
        'process',
        'story',
        'samples',
        'coordination',
        'real-media',
        'gallery',
        'details',
        'booking-basics',
        'seo',
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
    const requiredGroups = ['editorial', 'manifesto', 'audience', 'boutique', 'process', 'signature', 'story', 'samples', 'coordination', 'hero-notes', 'hero-stats', 'trust', 'faq'];
    const managedIds = new Set(managedSectionDefaults.map((section) => section.id));
    const managedGroups = new Set(managedSectionDefaults.map((section) => section.group));

    expect(requiredIds.filter((id) => !managedIds.has(id))).toEqual([]);
    expect(requiredGroups.filter((group) => !managedGroups.has(group))).toEqual([]);
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
});
