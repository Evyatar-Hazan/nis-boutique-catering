// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fallbackSiteSectionPreviewData } from './fallbackSiteSectionPreviewData';
import { ServicesSection } from './ServicesSection';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';

const renderServices = (services = fallbackSiteSectionPreviewData.services) => render(
  <SiteSectionPreviewDataProvider value={{ ...fallbackSiteSectionPreviewData, services }}>
    <ServicesSection />
  </SiteSectionPreviewDataProvider>,
);

afterEach(cleanup);

describe('ServicesSection', () => {
  it('renders the three approved offers in order with media, fit and contextual CTA', () => {
    const { container } = renderServices();
    const section = container.querySelector<HTMLElement>('#experiences');
    expect(section).not.toBeNull();
    if (!section) throw new Error('Services section was not found');
    const view = within(section);

    expect(view.getAllByRole('article')).toHaveLength(3);
    expect(view.getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent)).toEqual([
      'אוכל לשבת',
      'אירוח קטן',
      'מארזים לדרך',
    ]);
    expect(view.getAllByRole('img')).toHaveLength(3);
    expect(view.getAllByText(/מתאים במיוחד:/)).toHaveLength(3);
    expect(decodeURIComponent(view.getByRole('link', { name: 'לפרטים על אירוח קטן' }).getAttribute('href') ?? '')).toContain('אירוח קטן');
  });

  it('shows one clear unavailable state instead of partial service cards', () => {
    renderServices(fallbackSiteSectionPreviewData.services.slice(0, 2));
    expect(screen.getByRole('status')).toHaveTextContent('אפשרויות ההזמנה מתעדכנות כרגע');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
