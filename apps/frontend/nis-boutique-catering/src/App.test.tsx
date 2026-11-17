import { fireEvent, render, screen, within } from '@testing-library/react';
import { businessContact } from '@monorepo/content-schema';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { products } from '../data/products.js';
import App from './App';
import {
  setLeadMeasurementSink,
  type LeadMeasurementEnvelope,
} from './analytics/leadMeasurement';

let restoreMeasurementSink: (() => void) | undefined;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  restoreMeasurementSink?.();
  restoreMeasurementSink = undefined;
  document.body.classList.remove('has-order-overlay');
});

describe('NIS ordering site', () => {
  it('uses the approved product kosher wording in the banner, product cards, and order terms', () => {
    const kosherNotice = 'המוצרים בהכשר הבד״ץ, הרב לנדא ורובין.';
    const { container } = render(<App />);

    expect(container.querySelector('.hero-kosher')).toHaveTextContent(kosherNotice);
    expect(container.querySelectorAll('.product-kosher')).toHaveLength(products.length);
    for (const productKosher of container.querySelectorAll('.product-kosher')) {
      expect(productKosher).toHaveTextContent(kosherNotice);
    }

    const firstCard = container.querySelector(`[data-product-seq="${products[0]!.seq}"]`);
    fireEvent.click(within(firstCard as HTMLElement).getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /לפרטי ההזמנה/u }));
    fireEvent.click(screen.getByRole('button', { name: 'לקריאת תנאי ההזמנה' }));

    expect(within(screen.getByRole('dialog', { name: 'תנאי הזמנה ותשלום' })).getByText(kosherNotice)).toBeInTheDocument();
    expect(container).not.toHaveTextContent('בד״ץ העדה החרדית והרב לנדא');
  }, 30_000);

  it('renders only products that passed the publication gate', () => {
    const { container } = render(<App />);
    const cards = container.querySelectorAll('[data-product-seq]');

    expect(cards).toHaveLength(products.length);
    expect(products).toHaveLength(64);
    expect(products.every((product) => product.status === 'approved')).toBe(true);
    expect(products.some((product) => product.seq === 59)).toBe(false);
    expect(products.filter((product) => [50, 51, 55, 56, 57, 58, 63, 64, 65, 66, 67, 68, 69, 70, 71].includes(product.seq))).toHaveLength(15);
    expect(products.find((product) => product.seq === 70)?.name).toBe('מוס טעמים משתנים - 24 יחידות');
    expect(products.find((product) => product.seq === 65)).toMatchObject({ category: 'ארוחות בוקר', name: 'ארוחת בוקר זוגית', priceIls: 300 });
    expect(products.find((product) => product.seq === 66)).toMatchObject({ category: 'ארוחות בוקר', name: 'ארוחת בוקר יחיד', priceIls: 160 });
    expect(products.filter((product) => product.images.length === 0)).toHaveLength(21);
    expect(screen.getAllByAltText(/^לוגו NIS —/u)).toHaveLength(21);
    expect(screen.queryByText('אין תמונה')).not.toBeInTheDocument();
    expect(container.querySelector('.ordering-hero img')).toHaveAttribute('src', '/hero.jpg');
    expect(screen.getByRole('heading', { name: 'מגשי מיקס ושייקים' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'מוצרים חדשים' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ארוחות בוקר' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'קטגוריות התפריט' })).getAllByRole('link')[0]).toHaveTextContent('ארוחות בוקר');
    expect(within(screen.getByRole('navigation', { name: 'קטגוריות התפריט' })).getAllByRole('link')[0]).toHaveAttribute('aria-current', 'location');
    expect(container.querySelector('.catalog-category:first-child')).toHaveTextContent('ארוחת בוקר זוגית');
    expect(container.querySelector('.catalog-category:first-child')).toHaveTextContent('ארוחת בוקר יחיד');
    expect(container.querySelector('.catalog-facts')).toHaveTextContent('10 קטגוריות');
    expect(screen.getByRole('list', { name: 'שלב 1 מתוך 3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ומה הלאה?' })).toBeInTheDocument();
    expect(screen.getAllByText('מחיר בהתאמה אישית')).toHaveLength(3);
    expect(container).not.toHaveTextContent('050-3502615');
    expect(screen.getByText('ביתר עילית', { selector: '.ordering-location' })).toBeInTheDocument();
    expect(container.querySelectorAll('.ordering-brand__mark')).toHaveLength(2);
    for (const brandMark of container.querySelectorAll('.ordering-brand__mark')) {
      expect(brandMark).toHaveTextContent(/^Nis$/u);
    }
    expect(container.querySelectorAll('.product-kosher svg')).toHaveLength(products.length);
  });

  it('connects the single-breakfast planner option to the existing individual product', () => {
    render(<App />);
    const guestOptions = screen.getByRole('group', { name: 'כמה אורחים?' });
    const optionButtons = within(guestOptions).getAllByRole('button');

    expect(optionButtons.map((button) => button.textContent)).toEqual(['ארוחת בוקר ליחיד', '20', '40', '80', '150']);
    fireEvent.click(optionButtons[0]!);

    expect(optionButtons[0]).toHaveClass('is-selected');
    expect(screen.getByRole('region', { name: 'הבחירות שלכם' })).toHaveTextContent('ארוחת בוקר ליחיד');
    expect(screen.getByRole('region', { name: 'הבחירות שלכם' })).toHaveTextContent('ארוחת בוקר יחיד · 1');
    expect(JSON.parse(window.localStorage.getItem('nis-order-cart-v1') ?? '{}')).toEqual({ 66: 1 });
  });

  it('uses the one approved business phone number', () => {
    render(<App />);

    expect(screen.getAllByText(businessContact.phoneDisplay).length).toBeGreaterThan(0);
    for (const link of screen.getAllByRole('link', { name: businessContact.phoneDisplay })) {
      expect(link).toHaveAttribute('href', businessContact.phoneHref);
    }
  });

  it('adds a product to the persistent cart and updates its quantity', () => {
    render(<App />);

    expect(screen.getAllByText('0', { selector: 'output' })).toHaveLength(products.length);
    fireEvent.click(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    expect(screen.getByRole('region', { name: 'הבחירות שלכם' })).toHaveTextContent(`${products[0]!.name} · 1`);
    expect(screen.getByText(/נוסף לעגלה/u, { selector: '.cart-toast' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);

    const dialog = screen.getByRole('dialog', { name: 'סל ההזמנה' });
    expect(within(dialog).getByText(products[0]!.name)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('nis-order-cart-v1') ?? '{}')).toEqual({
      [products[0]!.seq]: 1,
    });

    fireEvent.click(within(dialog).getByRole('button', { name: `הוסף ${products[0]!.name}` }));
    expect(within(dialog).getByText('2', { selector: 'output' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: `הפחת ${products[0]!.name}` }));
    fireEvent.click(within(dialog).getByRole('button', { name: `הפחת ${products[0]!.name}` }));
    expect(within(dialog).queryByText(products[0]!.name)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }).parentElement).toHaveTextContent('0');
  });

  it('keeps keyboard focus inside the cart and closes it with Escape', () => {
    render(<App />);
    const cartTrigger = screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!;
    fireEvent.click(cartTrigger);

    const dialog = screen.getByRole('dialog', { name: 'סל ההזמנה' });
    const closeButton = within(dialog).getByRole('button', { name: 'סגירת העגלה' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'סל ההזמנה' })).not.toBeInTheDocument();
    expect(cartTrigger).toHaveFocus();
  });

  it('manages focus and Escape across checkout and the nested terms dialog', () => {
    render(<App />);
    const cartTrigger = screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!;
    fireEvent.click(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    fireEvent.click(cartTrigger);
    fireEvent.click(screen.getByRole('button', { name: /לפרטי ההזמנה/u }));

    const checkout = screen.getByRole('dialog', { name: 'פרטי ההזמנה' });
    expect(within(checkout).getByRole('button', { name: 'סגירת פרטי ההזמנה' })).toHaveFocus();
    const termsTrigger = within(checkout).getByRole('button', { name: 'לקריאת תנאי ההזמנה' });
    fireEvent.click(termsTrigger);

    const terms = screen.getByRole('dialog', { name: 'תנאי הזמנה ותשלום' });
    expect(within(terms).getByRole('button', { name: 'סגירת התנאים' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(terms).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'תנאי הזמנה ותשלום' })).not.toBeInTheDocument();
    expect(termsTrigger).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'פרטי ההזמנה' })).not.toBeInTheDocument();
    expect(cartTrigger).toHaveFocus();
  });

  it('moves the cart toast away from the progress header while an overlay is open', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);

    expect(document.querySelector('.cart-toast')).toHaveClass('cart-toast--with-overlay');
  });

  it('requires customer details and acceptance of the order terms', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /לפרטי ההזמנה/u }));

    expect(screen.getByRole('dialog', { name: 'פרטי ההזמנה' })).toBeInTheDocument();
    expect(screen.getByLabelText('שם מלא')).toBeRequired();
    expect(screen.getByLabelText('טלפון')).toBeRequired();
    expect(screen.getByLabelText('תאריך האירוע')).toBeRequired();
    expect(screen.getByLabelText('שעת האירוע')).not.toBeRequired();
    expect(screen.getByRole('radio', { name: 'איסוף עצמי' })).toBeChecked();
    expect(screen.getByRole('list', { name: 'שלב 3 מתוך 3' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /קראתי את תנאי ההזמנה/u })).toBeRequired();
    expect(screen.getByRole('button', { name: 'שליחת הזמנה ב־WhatsApp' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'משלוח' }));
    expect(screen.getByLabelText('כתובת למשלוח')).toBeRequired();
    expect(screen.getByRole('group', { name: 'סיכום הפריטים' })).toHaveTextContent(products[0]!.name);
  });

  it('measures checkout start and validation without collecting customer data', () => {
    const events: LeadMeasurementEnvelope[] = [];
    restoreMeasurementSink = setLeadMeasurementSink((event) => events.push(event));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }));
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /לפרטי ההזמנה/u }));

    fireEvent.focus(screen.getByLabelText('שם מלא'));
    fireEvent.submit(screen.getByRole('button', { name: 'שליחת הזמנה ב־WhatsApp' }).closest('form')!);

    expect(events.map((event) => event.name)).toEqual([
      'nis_lead_form_start',
      'nis_lead_form_validation',
    ]);
    expect(events[1]).toEqual({
      name: 'nis_lead_form_validation',
      properties: { form_id: 'contact', invalid_field_count: 4, result: 'invalid' },
      schema_version: 1,
    });
    expect(JSON.stringify(events)).not.toContain('name:');
    expect(JSON.stringify(events)).not.toContain('phone:');
  });

  it('keeps the accessibility statement route available', () => {
    window.history.replaceState({}, '', '/accessibility/');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'הצהרת נגישות' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'תפריט בוטיק חלבי' })).not.toBeInTheDocument();
  });
});
