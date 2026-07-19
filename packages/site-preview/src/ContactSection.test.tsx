// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactSection } from './ContactSection';
import { fallbackSiteSectionPreviewData } from './fallbackSiteSectionPreviewData';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';

const renderContact = (onInquirySubmit = vi.fn()) => ({
  onInquirySubmit,
  ...render(
    <SiteSectionPreviewDataProvider value={fallbackSiteSectionPreviewData}>
      <ContactSection
        contactWhatsapp="https://wa.me/972503502615"
        email="nis@example.com"
        onInquirySubmit={onInquirySubmit}
      />
    </SiteSectionPreviewDataProvider>,
  ),
});

afterEach(cleanup);

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

  it('submits normalized inquiry data after a valid flow', () => {
    const { onInquirySubmit } = renderContact();
    fireEvent.change(screen.getByLabelText('שם מלא (חובה)'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון (חובה)'), { target: { value: '050-1234567' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים? (חובה)'), { target: { value: 'ניס בטעם של שבת' } });
    fireEvent.change(screen.getByLabelText('מספר סועדים (אופציונלי)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('הודעה קצרה (אופציונלי)'), { target: { value: 'נשמח לקבל פרטים' } });
    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    expect(onInquirySubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'שרה כהן',
      phone: '050-1234567',
      interest: 'ניס בטעם של שבת',
      guests: '12',
      message: 'נשמח לקבל פרטים',
    }));
  });
});
