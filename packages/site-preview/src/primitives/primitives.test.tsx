// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Accordion } from './Accordion';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { FormField } from './FormField';
import { OptimizedImage } from './OptimizedImage';

describe('site preview primitives', () => {
  beforeEach(() => document.body.replaceChildren());

  it('renders typed button and link variants', () => {
    render(<><Button type="button" variant="secondary">שמור</Button><Button href="#gallery" size="compact">גלריה</Button></>);
    expect(screen.getByRole('button', { name: 'שמור' })).toHaveClass('secondary');
    expect(screen.getByRole('link', { name: 'גלריה' })).toHaveAttribute('href', '#gallery');
  });

  it('forwards stable loading, disabled and outcome states', () => {
    render(<>
      <Button type="button" aria-busy="true">שולח</Button>
      <Button type="button" disabled>לא זמין</Button>
      <Button type="button" data-state="success">נשלח</Button>
      <Button type="button" data-state="error">נכשל</Button>
    </>);
    expect(screen.getByRole('button', { name: 'שולח' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'לא זמין' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'נשלח' })).toHaveAttribute('data-state', 'success');
    expect(screen.getByRole('button', { name: 'נכשל' })).toHaveAttribute('data-state', 'error');
  });

  it('opens one accordion item at a time with accessible state', () => {
    render(<Accordion items={[{ id: 'one', question: 'שאלה אחת', answer: 'תשובה אחת' }, { id: 'two', question: 'שאלה שתיים', answer: 'תשובה שתיים' }]} />);
    const first = screen.getByRole('button', { name: 'שאלה אחת' });
    const second = screen.getByRole('button', { name: 'שאלה שתיים' });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('connects field labels and error descriptions', () => {
    render(<FormField label="שם" error="יש למלא שם"><input name="name" /></FormField>);
    const input = screen.getByRole('textbox', { name: 'שם' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('יש למלא שם');
  });

  it('closes dialogs on escape and restores focus', () => {
    const onClose = vi.fn();
    const { rerender } = render(<><button type="button">פתחו</button><Dialog open={false} labelledBy="title" onClose={onClose}><h2 id="title">כותרת</h2></Dialog></>);
    const trigger = screen.getByRole('button', { name: 'פתחו' });
    trigger.focus();
    rerender(<><button type="button">פתחו</button><Dialog open labelledBy="title" onClose={onClose}><h2 id="title">כותרת</h2><button type="button" tabIndex={-1}>רקע</button><button type="button">סגרו</button></Dialog></>);
    expect(screen.getByRole('button', { name: 'סגרו' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<><button type="button">פתחו</button><Dialog open={false} labelledBy="title" onClose={onClose}><h2 id="title">כותרת</h2></Dialog></>);
    expect(trigger).toHaveFocus();
  });

  it('reserves image dimensions and emits responsive sources', () => {
    render(<OptimizedImage alt="מגש" image={{ src: '/media/tray.webp', width: 1200, height: 800, responsive: true, sizes: '50vw' }} />);
    const image = screen.getByRole('img', { name: 'מגש' });
    expect(image).toHaveAttribute('width', '1200');
    expect(image.closest('picture')?.querySelector('source[type="image/avif"]')).toBeInTheDocument();
  });
});
