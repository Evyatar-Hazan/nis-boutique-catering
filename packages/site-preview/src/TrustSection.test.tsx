// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';
import { TrustSection } from './TrustSection';
import { siteSectionPreviewDataFixture } from './test/siteSectionPreviewDataFixture';

const renderTrust = (points = siteSectionPreviewDataFixture.trust.points) => render(
  <SiteSectionPreviewDataProvider value={{
    ...siteSectionPreviewDataFixture,
    trust: { ...siteSectionPreviewDataFixture.trust, points },
  }}>
    <TrustSection />
  </SiteSectionPreviewDataProvider>,
);

afterEach(cleanup);

describe('TrustSection', () => {
  it('renders only the three approved trust points with a food image', () => {
    renderTrust();

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent)).toEqual([
      'אוכל טרי ומוקפד',
      'הגשה אסתטית ומוכנה לשולחן',
      'התאמה אישית ושירות אנושי',
    ]);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'שולחן אירוח של Nis עם מנות ומגשים מוכנים להגשה');
    expect(document.body).not.toHaveTextContent('יהודית');
    expect(document.body).not.toHaveTextContent('הסיפור של המותג');
    expect(screen.queryByRole('blockquote')).not.toBeInTheDocument();
  });

  it('does not render partial trust claims', () => {
    renderTrust(siteSectionPreviewDataFixture.trust.points.slice(0, 2));
    expect(screen.getByRole('status')).toHaveTextContent('פרטי השירות מתעדכנים כרגע');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
