// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fallbackSiteSectionPreviewData } from './fallbackSiteSectionPreviewData';
import { ProcessSection } from './ProcessSection';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';

const renderProcess = (processSteps = fallbackSiteSectionPreviewData.processSteps) => render(
  <SiteSectionPreviewDataProvider value={{ ...fallbackSiteSectionPreviewData, processSteps }}>
    <ProcessSection />
  </SiteSectionPreviewDataProvider>,
);

afterEach(cleanup);

describe('ProcessSection', () => {
  it('renders one ordered four-step process and three approved operational notes', () => {
    const { container } = renderProcess();
    const section = container.querySelector<HTMLElement>('#process');
    expect(section).not.toBeNull();
    if (!section) throw new Error('Process section was not found');
    const view = within(section);

    expect(view.getAllByRole('listitem')).toHaveLength(4);
    expect(view.getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent)).toEqual([
      'שולחים פרטים בוואטסאפ',
      'מדייקים את ההזמנה',
      'Nis מכינה ואורזת',
      'אוספים או מקבלים במשלוח',
      'אזור פעילות',
      'אופן קבלה',
      'תיאום מראש',
    ]);
    expect(view.getByRole('complementary', { name: 'מידע שימושי להזמנה' })).toBeInTheDocument();
  });

  it('does not render a partial process when its content source is incomplete', () => {
    renderProcess(fallbackSiteSectionPreviewData.processSteps.slice(0, 3));
    expect(screen.getByRole('status')).toHaveTextContent('שלבי ההזמנה מתעדכנים כרגע');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
