import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    configurable: true,
  });
});

describe('Nis boutique catering app', () => {
  it('renders the main navigation and hero content', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'מה מזמינים' })).toHaveAttribute('href', '#experiences');
    expect(screen.getByRole('link', { name: 'גלריה' })).toHaveAttribute('href', '#gallery');
    expect(
      screen.getByRole('heading', {
        name: /קייטרינג בוטיק ביתי/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /דברו איתנו בוואטסאפ/i })[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText('מגשי אירוח')[0]).toBeInTheDocument();
    expect(screen.getAllByText('מומלץ לפנות מוקדם')[0]).toBeInTheDocument();
    expect(screen.getByText('אירוח קטן')).toBeInTheDocument();
    expect(screen.getByText('מארזים חכמים לדרך ולרגעים מיוחדים')).toBeInTheDocument();
  });

  it('filters the gallery by category', () => {
    render(<App />);

    const initialButtons = screen.getAllByRole('button', { name: /פתח תמונה:/i });
    expect(initialButtons).toHaveLength(6);

    fireEvent.click(screen.getByRole('button', { name: 'דגים' }));

    const filteredButtons = screen.getAllByRole('button', { name: /פתח תמונה:/i });
    expect(filteredButtons).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'דגים' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the lightbox and closes it on escape', () => {
    render(<App />);

    const triggerButton = screen.getByRole('button', { name: 'פתח תמונה: שולחן אירוח מוכן' });
    triggerButton.focus();
    fireEvent.click(triggerButton);

    const dialog = screen.getByRole('dialog', { name: /שולחן אירוח מוכן/i });
    const closeButton = within(dialog).getByRole('button', { name: 'סגור תמונה' });
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass('is-lightbox-open');
    expect(closeButton).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('is-lightbox-open');
    expect(triggerButton).toHaveFocus();
  });

  it('lets visitors choose between the three service experiences', () => {
    render(<App />);

    const experienceSection = screen.getByRole('heading', { name: /מהרגע שבוחרים כיוון/i }).closest('section');
    expect(experienceSection).not.toBeNull();
    if (!experienceSection) {
      throw new Error('Experience section was not found');
    }

    const experienceChooser = within(experienceSection);
    expect(experienceChooser.getByRole('tab', { name: 'ניס בטעם של שבת' })).toBeInTheDocument();
    expect(experienceChooser.getByRole('tab', { name: 'ניס בכיס' })).toBeInTheDocument();
    expect(experienceChooser.getByRole('tab', { name: 'Travel Nis' })).toBeInTheDocument();
  });

  it('does not render duplicated booking basics or boutique sections', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: 'הפרטים הקטנים שעוזרים להחליט מהר יותר.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.' })).not.toBeInTheDocument();
  });

  it('renders the managed SEO service topics', () => {
    render(<App />);

    expect(screen.getByText('קייטרינג בוטיק בביתר עילית')).toBeInTheDocument();
    expect(screen.getByText('מגשי אירוח לאירועים קטנים')).toBeInTheDocument();
  });

  it('builds a whatsapp inquiry from the contact form submit', () => {
    const locationMock = {
      ...window.location,
      href: 'http://localhost:5174/',
    };

    Object.defineProperty(window, 'location', {
      value: locationMock,
      configurable: true,
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText('שם מלא'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון'), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText('מייל'), { target: { value: 'sara@example.com' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים?'), {
      target: { value: 'Travel Nis' },
    });
    fireEvent.change(screen.getByLabelText('מספר סועדים'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('הודעה קצרה'), {
      target: { value: 'נשמח למארז לדרך' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    expect(window.location.href).toContain('https://wa.me/972503502615?text=');
    expect(decodeURIComponent(window.location.href)).toContain('שם מלא: שרה כהן');
    expect(decodeURIComponent(window.location.href)).toContain('במה אתם מתעניינים?: Travel Nis');
    expect(decodeURIComponent(window.location.href)).toContain('הודעה קצרה: נשמח למארז לדרך');
  });

  it('renders the mobile sticky CTA with whatsapp and phone actions', () => {
    render(<App />);

    const stickyCta = screen.getByLabelText('פעולות מהירות ליצירת קשר');
    const links = stickyCta.querySelectorAll('a');

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('wa.me/972503502615'));
    expect(links[1]).toHaveAttribute('href', 'tel:+972503502615');
  });
});
