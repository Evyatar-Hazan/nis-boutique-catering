import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  afterEach(() => cleanup());

  it('renders the admin shell in demo mode', () => {
    render(<App />);
    expect(screen.getByText('Content Studio')).toBeInTheDocument();
    expect(screen.getAllByText('גלריה')).toHaveLength(2);
    expect(screen.getByDisplayValue('מיני לחמניות אישיות')).toBeInTheDocument();
  });

  it('opens section editing for site-wide content blocks', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'מקטעים' }));
    expect(screen.getByText('מקטעי תוכן')).toBeInTheDocument();
    expect(screen.getByDisplayValue('קייטרינג בוטיק ביתי לשבתות ואירועים קטנים')).toBeInTheDocument();
  });

  it('opens settings editing for contact and SEO fields', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'הגדרות' }));
    expect(screen.getByDisplayValue('050-3502615')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nis Boutique Catering')).toBeInTheDocument();
  });
});
