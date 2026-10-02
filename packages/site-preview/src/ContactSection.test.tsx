// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { businessContact } from '@monorepo/content-schema';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactSection, validateContactInquiry } from './ContactSection';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';
import { siteSectionPreviewDataFixture } from './test/siteSectionPreviewDataFixture';

const renderContact = (onInquirySubmit = vi.fn()) => ({
  onInquirySubmit,
  ...render(
    <SiteSectionPreviewDataProvider value={siteSectionPreviewDataFixture}>
      <ContactSection
        contactWhatsapp={businessContact.whatsappBase}
        email="nis@example.com"
        onInquirySubmit={onInquirySubmit}
      />
    </SiteSectionPreviewDataProvider>,
  ),
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const validInquiry = {
  date: '',
  guests: '',
  interest: 'אוכל לשבת',
  message: '',
  name: 'שרה כהן',
  phone: '050-1234567',
};

describe('validateContactInquiry', () => {
  it('allows an omitted date and guest count', () => {
    expect(validateContactInquiry(validInquiry)).toEqual({});
  });

  it.each([
    ['2026-10-04', 'תאריך האירוע חייב להיות לפחות שלושה ימים מראש.'],
    ['not-a-date', 'כתבו תאריך תקין.'],
    ['2026-02-30', 'כתבו תאריך תקין.'],
  ])('rejects an invalid event date (%s)', (date, expectedError) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));

    expect(validateContactInquiry({ ...validInquiry, date })).toMatchObject({ date: expectedError });
  });

  it.each(['2026-10-05', '2026-10-06'])('allows the third calendar day and later event dates (%s)', (date) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));

    expect(validateContactInquiry({ ...validInquiry, date })).toEqual({});
  });

  it('uses midnight in Israel rather than the browser timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T20:59:59Z'));
    expect(validateContactInquiry({ ...validInquiry, date: '2026-10-04' })).toEqual({});

    vi.setSystemTime(new Date('2026-10-01T21:00:00Z'));
    expect(validateContactInquiry({ ...validInquiry, date: '2026-10-04' })).toMatchObject({
      date: 'תאריך האירוע חייב להיות לפחות שלושה ימים מראש.',
    });
  });

  it.each([
    ['2026-01-30T10:00:00Z', '2026-02-01', '2026-02-02'],
    ['2026-12-30T10:00:00Z', '2027-01-01', '2027-01-02'],
  ])('adds three calendar days across month and year boundaries from %s', (now, tooEarly, allowed) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));

    expect(validateContactInquiry({ ...validInquiry, date: tooEarly })).toHaveProperty('date');
    expect(validateContactInquiry({ ...validInquiry, date: allowed })).toEqual({});
  });

  it.each(['0', '-1', '1.5', 'not-a-number'])('rejects a non-positive-integer guest count (%s)', (guests) => {
    expect(validateContactInquiry({ ...validInquiry, guests })).toMatchObject({
      guests: 'מספר הסועדים חייב להיות מספר שלם גדול מאפס.',
    });
  });
});

describe('ContactSection', () => {
  it('renders four approved FAQs and only the six planned form fields', () => {
    const { container } = renderContact();
    const faq = container.querySelector<HTMLElement>('.contact-faq');
    expect(faq).not.toBeNull();
    if (!faq) throw new Error('Contact FAQ was not found');

    expect(within(faq).getAllByRole('button')).toHaveLength(4);
    expect(container.querySelectorAll('.contact-form input, .contact-form select, .contact-form textarea')).toHaveLength(6);
    expect(screen.queryByLabelText(/מייל/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/אופן קבלה/)).not.toBeInTheDocument();
  });

  it('shows inline errors and focuses the first invalid required field', () => {
    const { onInquirySubmit } = renderContact();
    const submit = screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' });
    fireEvent.submit(submit.closest('form')!);

    expect(screen.getByText('כתבו שם של לפחות שני תווים.')).toBeInTheDocument();
    expect(screen.getByText('כתבו מספר טלפון תקין.')).toBeInTheDocument();
    expect(screen.getByText('בחרו סוג הזמנה.')).toBeInTheDocument();
    expect(screen.getByLabelText('שם מלא (חובה)')).toHaveFocus();
    expect(onInquirySubmit).not.toHaveBeenCalled();
  });

  it('reflects date and guest constraints in the browser inputs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));
    renderContact();

    expect(screen.getByLabelText('תאריך רצוי (אופציונלי)')).toHaveAttribute('min', '2026-10-05');
    expect(screen.getByLabelText('מספר סועדים (אופציונלי)')).toHaveAttribute('step', '1');
  });

  it('shows the event-date error inline and focuses the date field first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));
    const { onInquirySubmit } = renderContact();

    fireEvent.change(screen.getByLabelText('שם מלא (חובה)'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון (חובה)'), { target: { value: '050-1234567' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים? (חובה)'), { target: { value: 'אוכל לשבת' } });
    fireEvent.change(screen.getByLabelText('תאריך רצוי (אופציונלי)'), { target: { value: '2026-10-04' } });
    fireEvent.change(screen.getByLabelText('מספר סועדים (אופציונלי)'), { target: { value: '1.5' } });
    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    const dateInput = screen.getByLabelText('תאריך רצוי (אופציונלי)');
    const guestsInput = screen.getByLabelText('מספר סועדים (אופציונלי)');
    expect(screen.getByText('תאריך האירוע חייב להיות לפחות שלושה ימים מראש.')).toBeInTheDocument();
    expect(screen.getByText('מספר הסועדים חייב להיות מספר שלם גדול מאפס.')).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('aria-invalid', 'true');
    expect(dateInput).toHaveAccessibleDescription('תאריך האירוע חייב להיות לפחות שלושה ימים מראש.');
    expect(guestsInput).toHaveAttribute('aria-invalid', 'true');
    expect(guestsInput).toHaveAccessibleDescription('מספר הסועדים חייב להיות מספר שלם גדול מאפס.');
    expect(dateInput).toHaveFocus();
    expect(onInquirySubmit).not.toHaveBeenCalled();
  });

  it('submits normalized inquiry data after a valid flow', () => {
    const { onInquirySubmit } = renderContact();
    fireEvent.change(screen.getByLabelText('שם מלא (חובה)'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון (חובה)'), { target: { value: '050-1234567' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים? (חובה)'), { target: { value: 'אוכל לשבת' } });
    fireEvent.change(screen.getByLabelText('מספר סועדים (אופציונלי)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('הודעה קצרה (אופציונלי)'), { target: { value: 'נשמח לקבל פרטים' } });
    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    expect(onInquirySubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'שרה כהן',
      phone: '050-1234567',
      interest: 'אוכל לשבת',
      guests: '12',
      message: 'נשמח לקבל פרטים',
    }));
  });
});
