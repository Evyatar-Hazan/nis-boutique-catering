import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Topbar } from './SiteChrome';

describe('Topbar', () => {
  it('renders four primary anchors with active state', () => {
    render(<Topbar activeNavSection="#gallery" isScrolled={false} topbarWhatsapp="https://wa.me/972500000000" />);
    const navigation = screen.getByRole('navigation', { name: 'עמודי האתר' });
    const links = within(navigation).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(within(navigation).getByRole('link', { name: 'גלריה' })).toHaveClass('is-active');
  });

  it('closes the mobile menu after selection and Escape', () => {
    render(<Topbar activeNavSection="#top" isScrolled topbarWhatsapp="https://wa.me/972500000000" />);
    const openButton = screen.getByRole('button', { name: 'פתיחת תפריט' });
    fireEvent.click(openButton);
    expect(screen.getByRole('button', { name: 'סגירת תפריט' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'מה מזמינים' })).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: 'גלריה' }));
    expect(screen.getByRole('button', { name: 'פתיחת תפריט' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'פתיחת תפריט' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת תפריט' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'פתיחת תפריט' })).toHaveFocus();
  });
});
