import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('nis Boutique Catering app', () => {
  it('renders the main navigation and hero content', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /קייטרינג בוטיק ביתי/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /קבלו תפריט מותאם בוואטסאפ/i }),
    ).toBeInTheDocument();
  });

  it('filters the gallery by category', () => {
    render(<App />);

    const initialButtons = screen.getAllByRole('button', { name: /פתח תמונה:/i });
    expect(initialButtons).toHaveLength(14);

    fireEvent.click(screen.getByRole('button', { name: 'דגים' }));

    const filteredButtons = screen.getAllByRole('button', { name: /פתח תמונה:/i });
    expect(filteredButtons).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'דגים' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the lightbox and closes it on escape', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'פתח תמונה: שולחן אירוח מוכן' }));

    const dialog = screen.getByRole('dialog', { name: /שולחן אירוח מוכן/i });
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass('is-lightbox-open');
    expect(within(dialog).getByRole('button', { name: 'סגור תמונה' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('is-lightbox-open');
  });
});
