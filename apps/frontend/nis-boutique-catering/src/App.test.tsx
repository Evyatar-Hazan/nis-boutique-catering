import { fireEvent, render, screen, within } from '@testing-library/react';
import { businessContact } from '@monorepo/content-schema';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

const originalLocation = window.location;

afterEach(() => {
  window.history.replaceState({}, '', '/');
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    configurable: true,
  });
});

describe('Nis boutique catering app', () => {
  it('moves focus past repeated navigation with the skip link', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: 'דלג לתוכן המרכזי' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('renders the main navigation and hero content', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('navigation', { name: 'עמודי האתר' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'מה מזמינים' })).toHaveAttribute('href', '#experiences');
    expect(screen.getByRole('link', { name: 'גלריה' })).toHaveAttribute('href', '#gallery');
    expect(
      screen.getByRole('heading', {
        name: 'אירוח שנראה מוקפד ומרגיש ביתי.',
      }),
    ).toBeInTheDocument();
    const hero = container.querySelector<HTMLElement>('.hero--public');
    expect(hero).not.toBeNull();
    if (!hero) {
      throw new Error('Public hero was not found');
    }
    const heroView = within(hero);
    expect(heroView.getByText('אוכל לשבת, אירוח קטן ומארזים לדרך בהתאמה אישית.')).toBeInTheDocument();
    const primaryCta = heroView.getByRole('link', { name: 'דברו איתנו בוואטסאפ' });
    expect(decodeURIComponent(primaryCta.getAttribute('href') ?? '')).toContain('אוכל לשבת, אירוח קטן או מארזים לדרך');
    expect(heroView.getByRole('link', { name: 'לגלריה' })).toHaveAttribute('href', '#gallery');
    expect(within(heroView.getByRole('list', { name: 'היתרונות של Nis' })).getAllByRole('listitem')).toHaveLength(3);
    expect(heroView.getByText('הכנה טרייה')).toBeInTheDocument();
    expect(heroView.getByText('הגשה מוכנה')).toBeInTheDocument();
    expect(heroView.getByText('תיאום אישי')).toBeInTheDocument();
    expect(heroView.getByRole('img', {
      name: 'שולחן בופה של Nis עם רולים, מאפים, סלטים אישיים ומנות מוכנות להגשה',
    })).toHaveAttribute('width', '1200');
    expect(hero.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('.intro-band')).not.toBeInTheDocument();
    expect(container.querySelector('.manifesto-section')).not.toBeInTheDocument();
    expect(container.querySelector('#audience-title')).not.toBeInTheDocument();
  });

  it('filters the gallery by category', async () => {
    const { container } = render(<App />);

    const initialButtons = await screen.findAllByRole('button', { name: /פתח תמונה:/i });
    expect(initialButtons).toHaveLength(6);

    fireEvent.click(screen.getByRole('button', { name: 'דגים' }));

    const filteredButtons = await screen.findAllByRole('button', { name: /פתח תמונה:/i });
    expect(filteredButtons).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'דגים' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('#gallery video')).toHaveLength(0);
    expect(container.querySelector('.real-media-section')).not.toBeInTheDocument();
  });

  it('opens the lightbox and closes it on escape', async () => {
    render(<App />);

    const triggerButton = await screen.findByRole('button', { name: 'פתח תמונה: שולחן אירוח מוכן' });
    triggerButton.focus();
    fireEvent.click(triggerButton);

    const dialog = await screen.findByRole('dialog', { name: /שולחן אירוח מוכן/i });
    const closeButton = within(dialog).getByRole('button', { name: 'סגור תמונה' });
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass('is-lightbox-open');
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('is-lightbox-open');
    expect(triggerButton).toHaveFocus();
  });

  it('shows all three service offers without a hidden carousel state', async () => {
    render(<App />);

    const experienceHeading = await screen.findByRole('heading', { name: 'שלוש דרכים לארח עם Nis.' });
    const experienceSection = experienceHeading.closest('section');
    expect(experienceSection).not.toBeNull();
    if (!experienceSection) {
      throw new Error('Experience section was not found');
    }

    const offers = within(experienceSection);
    expect(offers.getAllByRole('article')).toHaveLength(3);
    expect(offers.getByRole('heading', { level: 3, name: 'אוכל לשבת' })).toBeInTheDocument();
    expect(offers.getByRole('heading', { level: 3, name: 'אירוח קטן' })).toBeInTheDocument();
    expect(offers.getByRole('heading', { level: 3, name: 'מארזים לדרך' })).toBeInTheDocument();
    expect(offers.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('does not render removed duplicate sections', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: 'הפרטים הקטנים שעוזרים להחליט מהר יותר.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'שלוש אפשרויות ברורות. בוחרים כיוון וממשיכים לפנייה.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'שלוש קטגוריות ברורות. שפה אחת של אירוח.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'בוטיק זו לא מילה. זו הדרך שבה כל פרט מרגיש נכון יותר.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'כיוונים טעימים שקל להתחיל מהם שיחה.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /קייטרינג בוטיק ביתי.*לשבתות ואירועים קטנים/i })).not.toBeInTheDocument();
  });

  it('builds a whatsapp inquiry from the contact form submit', async () => {
    const locationMock = {
      ...window.location,
      href: 'http://localhost:5174/',
    };

    Object.defineProperty(window, 'location', {
      value: locationMock,
      configurable: true,
    });

    render(<App />);

    fireEvent.change(await screen.findByLabelText('שם מלא (חובה)'), { target: { value: 'שרה כהן' } });
    fireEvent.change(screen.getByLabelText('טלפון (חובה)'), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText('במה אתם מתעניינים? (חובה)'), {
      target: { value: 'ניס בטעם של שבת' },
    });
    fireEvent.change(screen.getByLabelText('מספר סועדים (אופציונלי)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('הודעה קצרה (אופציונלי)'), {
      target: { value: 'נשמח למארז לדרך' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'שלחו פנייה בוואטסאפ' }).closest('form')!);

    expect(window.location.href).toContain(`${businessContact.whatsappBase}?text=`);
    expect(decodeURIComponent(window.location.href)).toContain('שם מלא: שרה כהן');
    expect(decodeURIComponent(window.location.href)).toContain('במה אתם מתעניינים?: ניס בטעם של שבת');
    expect(decodeURIComponent(window.location.href)).toContain('הודעה קצרה: נשמח למארז לדרך');
  });

  it('renders the mobile sticky CTA with whatsapp and phone actions', () => {
    render(<App />);

    const stickyCta = document.querySelector('.mobile-sticky-cta');
    expect(stickyCta).not.toBeNull();
    if (!stickyCta) {
      throw new Error('Mobile sticky CTA was not found');
    }
    const links = stickyCta.querySelectorAll('a');

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining(businessContact.whatsappBase));
    expect(links[1]).toHaveAttribute('href', businessContact.phoneHref);
  });

  it('places floating contact actions in a named navigation landmark', () => {
    render(<App />);

    const actions = screen.getByRole('navigation', { name: 'פעולות מהירות ליצירת קשר' });
    expect(actions.querySelector('.floating-whatsapp')).toBeInTheDocument();
    expect(actions.querySelector('.mobile-sticky-cta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'הצהרת נגישות' })).toHaveAttribute('href', '/accessibility/');
  });

  it('renders the dedicated accessibility statement route without the public sections', () => {
    window.history.replaceState({}, '', '/accessibility/');

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'הצהרת נגישות' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'תקן היעד והבדיקות' })).toBeInTheDocument();
    expect(screen.getByText(/ת״י 5568 חלק 1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `טלפון: ${businessContact.phoneDisplay}` })).toHaveAttribute(
      'href',
      businessContact.phoneHref,
    );
    expect(screen.getByRole('link', { name: /דואר אלקטרוני:/ })).toHaveAttribute('href', 'mailto:nisboutiquecatering@gmail.com');
    expect(screen.queryByRole('heading', { name: 'אירוח שנראה מוקפד ומרגיש ביתי.' })).not.toBeInTheDocument();
  });
});
