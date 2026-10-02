import { useState, type FormEvent } from 'react';
import { Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { Accordion, Button, FormField, Section } from './primitives';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';

export interface ContactInquiry {
  readonly date: string;
  readonly guests: string;
  readonly interest: string;
  readonly message: string;
  readonly name: string;
  readonly phone: string;
}

type ContactField = keyof ContactInquiry;
type ContactErrors = Partial<Record<ContactField, string>>;

const readField = (formData: FormData, field: ContactField) => String(formData.get(field) ?? '').trim();

const formatLocalDate = (date: Date) => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDateInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
};

const isPositiveInteger = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

export const validateContactInquiry = (inquiry: ContactInquiry): ContactErrors => {
  const errors: ContactErrors = {};
  if (inquiry.name.length < 2) errors.name = 'כתבו שם של לפחות שני תווים.';
  if (inquiry.phone.replace(/\D/g, '').length < 9) errors.phone = 'כתבו מספר טלפון תקין.';
  if (!inquiry.interest) errors.interest = 'בחרו סוג הזמנה.';
  if (inquiry.date && !isValidDateInput(inquiry.date)) {
    errors.date = 'כתבו תאריך תקין.';
  } else if (inquiry.date && inquiry.date < formatLocalDate(new Date())) {
    errors.date = 'תאריך האירוע לא יכול להיות בעבר.';
  }
  if (inquiry.guests && !isPositiveInteger(inquiry.guests)) {
    errors.guests = 'מספר הסועדים חייב להיות מספר שלם גדול מאפס.';
  }
  return errors;
};

interface ContactSectionProps {
  readonly contactWhatsapp: string;
  readonly email: string;
  readonly onInquirySubmit: (inquiry: ContactInquiry) => void;
}

export const ContactSection = ({ contactWhatsapp, email, onInquirySubmit }: ContactSectionProps) => {
  const { contact, phoneHref } = useSiteSectionPreviewData();
  const { formLabels } = contact;
  const [errors, setErrors] = useState<ContactErrors>({});
  const minimumEventDate = formatLocalDate(new Date());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const inquiry: ContactInquiry = {
      name: readField(formData, 'name'),
      phone: readField(formData, 'phone'),
      interest: readField(formData, 'interest'),
      date: readField(formData, 'date'),
      guests: readField(formData, 'guests'),
      message: readField(formData, 'message'),
    };
    const nextErrors = validateContactInquiry(inquiry);
    setErrors(nextErrors);

    const firstInvalidField = Object.keys(nextErrors)[0] as ContactField | undefined;
    if (firstInvalidField) {
      (form.elements.namedItem(firstInvalidField) as HTMLElement | null)?.focus();
      return;
    }

    onInquirySubmit(inquiry);
  };

  return (
    <Section id="contact" className="contact-section scroll-scene scroll-scene--contact" labelledBy="contact-title" tone="dark">
      <div className="container">
        <div className="contact-conversion-heading reveal" data-reveal-duration="680" data-reveal-variant="focus">
          {contact.eyebrow ? <p className="eyebrow">{contact.eyebrow}</p> : null}
          <h2 id="contact-title">{contact.title}</h2>
          {contact.description ? <p>{contact.description}</p> : null}
          <div className="contact-actions">
            <Button href={contactWhatsapp} data-event="contact_whatsapp">
              <MessageCircle aria-hidden="true" />
              {contact.submitCta.label}
            </Button>
            <Button href={phoneHref} variant="secondary">
              <Phone aria-hidden="true" />
              {formLabels.phoneCta}
            </Button>
            <a className="contact-line" href={`mailto:${email}`}>
              <Mail aria-hidden="true" />
              {email}
            </a>
          </div>
        </div>

        <div className="contact-conversion-grid" data-reveal-stagger="90">
          <div className="contact-faq reveal" role="region" data-reveal-direction="inline-start" data-reveal-duration="720" aria-label="שאלות נפוצות">
            <Accordion items={contact.faqs} />
          </div>

          <form className="contact-form reveal" data-reveal-direction="inline-end" data-reveal-duration="720" noValidate onSubmit={handleSubmit}>
            <FormField label={`${formLabels.name} (חובה)`} error={errors.name}>
              <input name="name" autoComplete="name" />
            </FormField>
            <FormField label={`${formLabels.phone} (חובה)`} error={errors.phone}>
              <input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
            </FormField>
            <FormField label={`${formLabels.interest} (חובה)`} error={errors.interest}>
              <select name="interest" defaultValue="">
                <option value="" disabled>בחרו סוג הזמנה</option>
                {contact.interestOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </FormField>
            <FormField label={`${formLabels.date} (אופציונלי)`} error={errors.date}>
              <input name="date" type="date" min={minimumEventDate} />
            </FormField>
            <FormField label={`${formLabels.guests} (אופציונלי)`} error={errors.guests}>
              <input name="guests" type="number" min="1" step="1" inputMode="numeric" />
            </FormField>
            <FormField label={`${formLabels.message} (אופציונלי)`}>
              <textarea name="message" rows={4} />
            </FormField>
            <Button fullWidth type="submit">
              <Send aria-hidden="true" />
              {contact.submitCta.label}
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
};
