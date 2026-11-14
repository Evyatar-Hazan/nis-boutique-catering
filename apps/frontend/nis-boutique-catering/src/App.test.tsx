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
  it('renders only products that passed the publication gate', () => {
    const { container } = render(<App />);
    const cards = container.querySelectorAll('[data-product-seq]');

    expect(cards).toHaveLength(products.length);
    expect(products).toHaveLength(28);
    expect(products.every((product) => product.status === 'approved')).toBe(true);
    expect(products.some((product) => [59, 64, 65, 67].includes(product.seq))).toBe(false);
    expect(container).not.toHaveTextContent('050-3502615');
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
    fireEvent.click(screen.getAllByRole('button', { name: /^העגלה שלי/u })[0]!);

    const dialog = screen.getByRole('dialog', { name: 'סל ההזמנה' });
    expect(within(dialog).getByText(products[0]!.name)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('nis-order-cart-v1') ?? '{}')).toEqual({
      [products[0]!.seq]: 1,
    });

    fireEvent.click(within(dialog).getByRole('button', { name: `הוסף ${products[0]!.name}` }));
    expect(within(dialog).getByText('2')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: `הפחת ${products[0]!.name}` }));
    fireEvent.click(within(dialog).getByRole('button', { name: `הפחת ${products[0]!.name}` }));
    expect(within(dialog).queryByText(products[0]!.name)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `הוסף כמות של ${products[0]!.name}` }).parentElement).toHaveTextContent('0');
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
    expect(screen.getByRole('checkbox', { name: /קראתי את תנאי ההזמנה/u })).toBeRequired();
    expect(screen.getByRole('button', { name: 'שליחת הזמנה ב־WhatsApp' })).toBeInTheDocument();
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
