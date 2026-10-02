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
    ['2026-10-01', 'תאריך האירוע לא יכול להיות בעבר.'],
    ['not-a-date', 'כתבו תאריך תקין.'],
    ['2026-02-30', 'כתבו תאריך תקין.'],
  ])('rejects an invalid event date (%s)', (date, expectedError) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 0, 30));

    expect(validateContactInquiry({ ...validInquiry, date })).toMatchObject({ date: expectedError });
  });

  it.each(['2026-10-02', '2026-10-03'])('allows today and future event dates (%s)', (date) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 23, 30));

    expect(validateContactInquiry({ ...validInquiry, date })).toEqual({});
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
    vi.setSystemTime(new Date(2026, 9, 2, 0, 30));
    renderContact();

    expect(screen.getByLabelText('תאריך רצוי (אופציונלי)')).toHaveAttribute('min', '2026-10-02');
    expect(screen.getByLabelText('מספר סועדים (אופציונלי)')).toHaveAttribute('step', '1');
  });

  it('shows the event-date error inline and focuses the date field first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 0, 30));
    const { onInquirySubmit } = renderContact();

    fireEvent.change(screen.getByLabelText('שם מלא (חובה)'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון (חובה)'), { target: { value: '050-1234567' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים? (חובה)'), { target: { value: 'אוכל לשבת' } });
    fireEvent.change(screen.getByLabelText('תאריך רצוי (אופציונלי)'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('מספר סועדים (אופציונלי)'), { target: { value: '1.5' } });
    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    const dateInput = screen.getByLabelText('תאריך רצוי (אופציונלי)');
    const guestsInput = screen.getByLabelText('מספר סועדים (אופציונלי)');
    expect(screen.getByText('תאריך האירוע לא יכול להיות בעבר.')).toBeInTheDocument();
    expect(screen.getByText('מספר הסועדים חייב להיות מספר שלם גדול מאפס.')).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('aria-invalid', 'true');
    expect(dateInput).toHaveAccessibleDescription('תאריך האירוע לא יכול להיות בעבר.');
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
