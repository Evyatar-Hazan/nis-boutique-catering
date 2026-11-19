import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import { Check, ChevronLeft, Clock3, MapPin, Menu, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Users, X } from 'lucide-react';
import { businessContact } from '@monorepo/content-schema';
import type { CatalogProduct } from '../../data/products.js';
import { useOrderCart } from '../hooks/useOrderCart';
import { trackLeadEvent } from '../analytics/leadMeasurement';

const formatPrice = (value: number) => new Intl.NumberFormat('he-IL').format(value);
const kosherNotice = 'המוצרים בהכשר הבד״ץ, הרב לנדא ורובין.';
const breakfastCategory = 'ארוחות בוקר';
const singleBreakfastName = 'ארוחת בוקר יחיד';
const singleBreakfastSelection = 'single-breakfast' as const;

type GuestSelection = number | typeof singleBreakfastSelection;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface DialogFocusOptions {
  readonly active: boolean;
  readonly dialogRef: RefObject<HTMLElement | null>;
  readonly initialFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly open: boolean;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
}

const useDialogFocus = ({ active, dialogRef, initialFocusRef, onClose, open, returnFocusRef }: DialogFocusOptions) => {
  const activeRef = useRef(active);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const explicitReturnTarget = returnFocusRef?.current ?? null;
    if (activeRef.current) initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements.at(-1);
      if (!firstFocusable || !lastFocusable) {
        event.preventDefault();
        return;
      }

      const focusIsOutside = !(document.activeElement instanceof Node) || !dialog.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === firstFocusable || focusIsOutside)) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && (document.activeElement === lastFocusable || focusIsOutside)) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const returnTarget = explicitReturnTarget
        ?? (previouslyFocused?.isConnected && previouslyFocused !== document.body ? previouslyFocused : null);
      returnTarget?.focus();
    };
  }, [dialogRef, initialFocusRef, open, returnFocusRef]);
};

const categoryNotes: Readonly<Record<string, string>> = {
  מאפים: 'מאפים וכריכונים לאירוח קל, נקי ואלגנטי',
  סלטים: 'קערת סלט 2.5 ליטר, מתאים ל־10–12 סועדים; ייתכנו שינויים בהתאם למלאי',
  'החמים שלנו': 'המגשים החמים מגיעים בתבנית 35×25 ס״מ, מתאים ל־12–15 סועדים',
  'מגשי מיקס ושייקים': 'מגשים ובקבוקים אישיים להשלמת שולחן האירוח',
};

const orderTerms = [
  'משלוחים בתשלום נוסף.',
  'בעת סגירת ההזמנה ישולם 50% מעלות ההזמנה; יתרת התשלום ביום האירוע. לא תינתן אפשרות לקבל הזמנה ללא סגירת התשלום.',
  'ביטול הזמנה עד 24 שעות לפני האירוע — חיוב 50% מהעלות הכוללת.',
  'ביטול או שינוי ביום האירוע — חיוב מלא.',
  'אירוע ליום שישי / מוצ״ש / יציאת הזמנה לפני 8:30 בבוקר — תוספת 150 ₪.',
  'מארזים אישיים: ניתן להזמין בהתאמה אישית ובתקציב שלכם.',
  kosherNotice,
] as const;

const orderProgress = ['בוחרים מגשים', 'סל ההזמנה', 'פרטי ההזמנה'] as const;

const OrderProgress = ({ activeStep }: { readonly activeStep: 1 | 2 | 3 }) => (
  <ol className="order-progress" aria-label={`שלב ${activeStep} מתוך 3`}>
    {orderProgress.map((label, index) => {
      const step = index + 1;
      return <li className={step === activeStep ? 'is-active' : step < activeStep ? 'is-complete' : ''} key={label}><b>{step < activeStep ? <Check /> : step}</b><span>{label}</span></li>;
    })}
  </ol>
);

interface ProductCardProps {
  readonly product: CatalogProduct;
  readonly quantity: number;
  readonly onQuantityChange: (quantity: number) => void;
}

const ProductCard = ({ product, quantity, onQuantityChange }: ProductCardProps) => {
  return (
    <article className={`product-card${quantity > 0 ? ' product-card--selected' : ''}`} data-product-seq={product.seq}>
      <div className={`product-media${product.images.length > 1 ? ' product-media--split' : ''}`}>
        {product.images.length === 0 ? (
          <div className="product-media__placeholder">
            <img
              className="product-media__logo"
              src="/brand/nis-logo.svg"
              alt={`לוגו NIS — ${product.name}`}
              loading="lazy"
            />
          </div>
        ) : product.images.map((image, index) => (
          <img
            key={image}
            src={`/images/${image}`}
            alt={`${product.name}${product.images.length > 1 ? ` — תמונה ${index + 1}` : ''}`}
            loading="lazy"
          />
        ))}
      </div>
      <div className="product-card__body">
        <div className="product-card__heading">
          <div><h3>{product.name}</h3>{quantity > 0 ? <span className="product-selected-badge"><Check /> בעגלה</span> : null}</div>
          <p className="product-price">
            {product.priceIls === null ? product.priceLabel : <bdi>{formatPrice(product.priceIls)} ₪</bdi>}
            {product.priceIls !== null && product.priceUnit === 'per_unit' ? <span>ליחידה</span> : null}
          </p>
        </div>
        {product.description ? <p className="product-description">{product.description}</p> : null}
        <p className="product-kosher"><ShieldCheck aria-hidden="true" /><span>{kosherNotice}</span></p>
        <div className="product-actions">
          <div className="quantity-stepper" aria-label={`כמות עבור ${product.name}`}>
            <button type="button" disabled={quantity === 0} onClick={() => onQuantityChange(Math.max(0, quantity - 1))} aria-label={`הפחת כמות של ${product.name}`}><Minus /></button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" onClick={() => onQuantityChange(quantity + 1)} aria-label={`הוסף כמות של ${product.name}`}><Plus /></button>
          </div>
        </div>
      </div>
    </article>
  );
};

interface OrderingSiteProps {
  readonly catalog: readonly CatalogProduct[];
}

export const OrderingSite = ({ catalog }: OrderingSiteProps) => {
  const categories = useMemo(() => {
    const availableCategories = [...new Set(catalog.map((product) => product.category))];
    return availableCategories.includes(breakfastCategory)
      ? [breakfastCategory, ...availableCategories.filter((category) => category !== breakfastCategory)]
      : availableCategories;
  }, [catalog]);
  const [observedCategory, setObservedCategory] = useState('');
  const activeCategory = categories.includes(observedCategory) ? observedCategory : (categories[0] ?? '');
  const singleBreakfastProduct = useMemo(
    () => catalog.find((product) => product.name === singleBreakfastName) ?? null,
    [catalog],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!visibleEntry) return;
      setObservedCategory(visibleEntry.target.id.replace('category-', ''));
    }, { rootMargin: '-18% 0px -68%', threshold: [0, 0.15, 0.35] });

    const categorySections = categories
      .map((category) => document.getElementById(`category-${category}`))
      .filter((section): section is HTMLElement => section !== null);
    categorySections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [categories]);
  const { clear, hasCustomPricing, itemCount, lines, quantities, setQuantity, total } = useOrderCart(catalog);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [guestSelection, setGuestSelection] = useState<GuestSelection | null>(null);
  const [occasion, setOccasion] = useState('');
  const [fulfillment, setFulfillment] = useState('איסוף עצמי');
  const [toast, setToast] = useState('');
  const cartReturnFocusRef = useRef<HTMLButtonElement>(null);
  const cartDialogRef = useRef<HTMLElement>(null);
  const cartCloseRef = useRef<HTMLButtonElement>(null);
  const checkoutDialogRef = useRef<HTMLElement>(null);
  const checkoutCloseRef = useRef<HTMLButtonElement>(null);
  const termsDialogRef = useRef<HTMLElement>(null);
  const termsCloseRef = useRef<HTMLButtonElement>(null);
  const termsTriggerRef = useRef<HTMLButtonElement>(null);
  const checkoutStartedRef = useRef(false);

  useDialogFocus({
    active: cartOpen,
    dialogRef: cartDialogRef,
    initialFocusRef: cartCloseRef,
    onClose: () => setCartOpen(false),
    open: cartOpen,
    returnFocusRef: cartReturnFocusRef,
  });
  useDialogFocus({
    active: checkoutOpen && !termsOpen,
    dialogRef: checkoutDialogRef,
    initialFocusRef: checkoutCloseRef,
    onClose: () => setCheckoutOpen(false),
    open: checkoutOpen,
    returnFocusRef: cartReturnFocusRef,
  });
  useDialogFocus({
    active: termsOpen,
    dialogRef: termsDialogRef,
    initialFocusRef: termsCloseRef,
    onClose: () => setTermsOpen(false),
    open: termsOpen,
    returnFocusRef: termsTriggerRef,
  });

  useEffect(() => {
    document.body.classList.toggle('has-order-overlay', cartOpen || checkoutOpen || termsOpen);
    return () => document.body.classList.remove('has-order-overlay');
  }, [cartOpen, checkoutOpen, termsOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateQuantity = (product: CatalogProduct, quantity: number) => {
    const previousQuantity = quantities[product.seq] ?? 0;
    setQuantity(product.seq, quantity);
    if (quantity > previousQuantity) setToast(`${product.name} נוסף לעגלה`);
    if (quantity === 0 && previousQuantity > 0) setToast(`${product.name} הוסר מהעגלה`);
  };

  const openCart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    cartReturnFocusRef.current = event.currentTarget;
    setCartOpen(true);
  };

  const selectSingleBreakfast = () => {
    if (!singleBreakfastProduct) return;
    setGuestSelection(singleBreakfastSelection);
    updateQuantity(singleBreakfastProduct, Math.max(1, quantities[singleBreakfastProduct.seq] ?? 0));
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalidFieldCount = event.currentTarget.querySelectorAll(':invalid').length;
    trackLeadEvent({
      name: 'nis_lead_form_validation',
      properties: {
        form_id: 'contact',
        invalid_field_count: invalidFieldCount,
        result: invalidFieldCount === 0 ? 'valid' : 'invalid',
      },
    });
    if (invalidFieldCount > 0) {
      event.currentTarget.reportValidity();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const date = String(formData.get('date') ?? '').trim();
    const time = String(formData.get('time') ?? '').trim();
    const fulfillment = String(formData.get('fulfillment') ?? 'איסוף עצמי').trim();
    const address = String(formData.get('address') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    const itemLines = lines.map((line, index) =>
      `${index + 1}. ${line.product.name} ×${line.quantity} — ${line.lineTotal === null ? line.product.priceLabel : `${formatPrice(line.lineTotal)} ₪`}`,
    );
    const message = [
      'הזמנה חדשה מהאתר — NIS Boutique Catering', '',
      `שם: ${name}`, `טלפון: ${phone}`, `תאריך האירוע: ${date}`, `שעת האירוע: ${time || 'טרם נקבעה'}`, `מספר אורחים: ${guestSelection === singleBreakfastSelection ? '1 — ארוחת בוקר ליחיד' : guestSelection ?? 'טרם נקבע'}`, `סוג האירוח: ${occasion || 'טרם נקבע'}`, `אופן קבלה: ${fulfillment}`, ...(address ? [`כתובת למשלוח: ${address}`] : []), `פרטים: ${notes || 'ללא'}`, '',
      'פריטים:', ...itemLines, '', `סה״כ ידוע: ${formatPrice(total)} ₪${hasCustomPricing ? ' + פריטים במחיר בהתאמה אישית' : ''}`,
    ].join('\n');
    trackLeadEvent({
      name: 'nis_lead_form_submit_success',
      properties: { form_id: 'contact', next_step: 'whatsapp_handoff' },
    });
    trackLeadEvent({
      name: 'nis_whatsapp_handoff',
      properties: { origin: 'lead_form', source: 'lead_form' },
    });
    window.location.href = `${businessContact.whatsappBase}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="ordering-site">
      <a className="skip-link" href="#catalog">דלג לתפריט</a>
      <header className="ordering-header">
        <a className="header-menu" href="#catalog" aria-label="מעבר לתפריט"><Menu aria-hidden="true" /><span>תפריט</span></a>
        <a className="ordering-brand" href="#top" aria-label="NIS Boutique Catering — ראש העמוד">
          <span className="ordering-brand__mark">Nis</span><span>BOUTIQUE CATERING</span>
        </a>
        <button className="header-cart" type="button" onClick={openCart}>
          <ShoppingBag aria-hidden="true" /><span>העגלה שלי</span><strong>{itemCount}</strong>
        </button>
      </header>

      <main>
        <section className="ordering-hero" id="top">
          <span className="hero-shape hero-shape--one" aria-hidden="true" />
          <span className="hero-shape hero-shape--two" aria-hidden="true" />
          <div className="ordering-hero__content">
            <p className="hero-new"><span>חדש!</span> אתר ההזמנות עלה לאוויר</p>
            <p className="hero-kosher">{kosherNotice}</p>
            <img src="/hero.jpg" alt="NIS Boutique Catering" />
            <h1>תפריט בוטיק חלבי</h1>
            <p className="hero-slogan">אסתטי. בטוב טעם.</p>
            <a className="hero-cta" href="#catalog">לתפריט</a>
            <a className="hero-phone" href={businessContact.phoneHref}>{businessContact.phoneDisplay}</a>
          </div>
        </section>

        <div className="order-toolbar">
          <nav className="category-nav" aria-label="קטגוריות התפריט">
            <div className="category-nav__track">{categories.map((category) => (
              <a
                className={activeCategory === category ? 'is-active' : ''}
                href={`#category-${category}`}
                aria-current={activeCategory === category ? 'location' : undefined}
                key={category}
                onClick={() => setObservedCategory(category)}
              >
                {category}
              </a>
            ))}</div>
          </nav>

          <aside className={`selection-rail${lines.length > 0 || guestSelection || occasion ? ' selection-rail--active' : ''}`} role="region" aria-label="הבחירות שלכם">
            <div className="selection-rail__summary"><span>הבחירות שלכם</span><strong>{lines.length} סוגים · {itemCount} יחידות</strong></div>
            <div className="selection-chips">
              {guestSelection ? <button type="button" onClick={() => setGuestSelection(null)}><Users /> {guestSelection === singleBreakfastSelection ? 'ארוחת בוקר ליחיד' : `${guestSelection} אורחים`} <X /></button> : null}
              {occasion ? <button type="button" onClick={() => setOccasion('')}>{occasion} <X /></button> : null}
              {lines.map((line) => <button type="button" key={line.product.seq} onClick={() => updateQuantity(line.product, 0)}>{line.product.name} · {line.quantity} <X /></button>)}
              {lines.length === 0 && !guestSelection && !occasion ? <span>הבחירות שתוסיפו יופיעו כאן</span> : null}
            </div>
            <button className="selection-rail__cart" type="button" onClick={openCart} disabled={lines.length === 0}><ShoppingBag /> לסל</button>
          </aside>
        </div>

        <section className="catalog-intro" id="catalog" aria-labelledby="catalog-title">
          <OrderProgress activeStep={1} />
          <p>שלב ראשון · בוחרים, מוסיפים ושולחים</p>
          <h2 id="catalog-title">האירוח שלכם מתחיל כאן.</h2>
          <div className="catalog-facts" aria-label="פרטי הקטלוג"><span>{catalog.length} מוצרים</span><span>{categories.length} קטגוריות</span><span>הזמנה ב־WhatsApp</span></div>
          <div className="event-planner" aria-label="עוזר תכנון האירוח">
            <div><Users /><span><b>מתכננים אירוח?</b> סמנו כמה אורחים ומה אופי האירוע — הבחירה תישמר למעלה ותצורף להזמנה.</span></div>
            <fieldset>
              <legend>כמה אורחים?</legend>
              {singleBreakfastProduct ? <button className={guestSelection === singleBreakfastSelection ? 'is-selected' : ''} type="button" onClick={selectSingleBreakfast}>ארוחת בוקר ליחיד</button> : null}
              {[20, 40, 80, 150].map((count) => <button className={guestSelection === count ? 'is-selected' : ''} type="button" key={count} onClick={() => setGuestSelection(count)}>{count}</button>)}
            </fieldset>
            <fieldset><legend>מה אופי האירוע?</legend>{['כיבוד קל', 'אירוע חגיגי', 'אירוע ישיבה'].map((type) => <button className={occasion === type ? 'is-selected' : ''} type="button" key={type} onClick={() => setOccasion(type)}>{type}</button>)}</fieldset>
          </div>
        </section>

        <div className="catalog-sections">
          {categories.map((category, categoryIndex) => (
            <section className="catalog-category" id={`category-${category}`} key={category} aria-labelledby={`category-title-${categoryIndex}`}>
              <div className="category-heading">
                <span>{String(categoryIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h2 id={`category-title-${categoryIndex}`}>{category}</h2>
                  {categoryNotes[category] ? <p>{categoryNotes[category]}</p> : null}
                </div>
              </div>
              <div className="product-grid">
                {catalog.filter((product) => product.category === category).map((product) => (
                  <ProductCard
                    key={product.seq}
                    product={product}
                    quantity={quantities[product.seq] ?? 0}
                    onQuantityChange={(quantity) => updateQuantity(product, quantity)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="after-order" aria-labelledby="after-order-title">
          <span className="after-order__eyebrow">אחרי השליחה</span>
          <h2 id="after-order-title">ומה הלאה?</h2>
          <p>עוברים על ההזמנה, מאשרים יחד ומתחילים להכין.</p>
          <ol>
            <li><b>1</b><div><h3>מקבלים הצעה</h3><p>אנחנו עוברים על הפריטים וחוזרים אליכם עם סיכום מסודר.</p></div></li>
            <li><b>2</b><div><h3>מאשרים ב־WhatsApp</h3><p>מוודאים תאריך, שעה, אופן קבלה ותשלום.</p></div></li>
            <li><b>3</b><div><h3>ואנחנו על זה</h3><p>מכינים את ההזמנה לקראת האירוע שלכם.</p></div></li>
          </ol>
        </section>
      </main>

      <footer className="ordering-footer">
        <div className="ordering-brand ordering-brand--footer"><span className="ordering-brand__mark">Nis</span><span>BOUTIQUE CATERING</span></div>
        <p>תפריט בוטיק חלבי — אסתטי. בטוב טעם.</p>
        <span className="ordering-location"><MapPin aria-hidden="true" /> ביתר עילית</span>
        <a href={businessContact.phoneHref}>{businessContact.phoneDisplay}</a>
        <a href="/accessibility/">הצהרת נגישות</a>
      </footer>

      <button className="floating-cart" type="button" onClick={openCart}>
        <ShoppingBag aria-hidden="true" /><span>העגלה שלי</span><strong>{itemCount}</strong>
      </button>

      {cartOpen ? (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside ref={cartDialogRef} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <OrderProgress activeStep={2} />
            <div className="drawer-heading">
              <div><span>{itemCount} פריטים</span><h2 id="cart-title">סל ההזמנה</h2></div>
              <button ref={cartCloseRef} type="button" onClick={() => setCartOpen(false)} aria-label="סגירת העגלה"><X /></button>
            </div>
            {lines.length === 0 ? (
              <div className="empty-cart"><ShoppingBag /><h3>העגלה עדיין ריקה</h3><p>בחרו משהו טעים מהתפריט.</p></div>
            ) : (
              <>
                <ul className="cart-lines">
                  {lines.map((line) => (
                    <li key={line.product.seq}>
                      {line.product.images[0] ? (
                        <img src={`/images/${line.product.images[0]}`} alt="" />
                      ) : (
                        <img className="cart-line-logo" src="/brand/nis-logo.svg" alt="" />
                      )}
                      <div><h3>{line.product.name}</h3><span>{line.lineTotal === null ? line.product.priceLabel : `${formatPrice(line.lineTotal)} ₪`}</span></div>
                      <div className="cart-line-actions">
                        <button type="button" onClick={() => setQuantity(line.product.seq, line.quantity - 1)} aria-label={`הפחת ${line.product.name}`}><Minus /></button>
                        <output>{line.quantity}</output>
                        <button type="button" onClick={() => setQuantity(line.product.seq, line.quantity + 1)} aria-label={`הוסף ${line.product.name}`}><Plus /></button>
                        <button type="button" onClick={() => setQuantity(line.product.seq, 0)} aria-label={`מחק ${line.product.name}`}><Trash2 /></button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-total"><span>{hasCustomPricing ? 'סה״כ ידוע' : 'סה״כ'}</span><strong>{formatPrice(total)} ₪</strong></div>
                {hasCustomPricing ? <p className="cart-custom-price">פריטים בהתאמה אישית יתומחרו בשיחת WhatsApp.</p> : null}
                <button className="primary-order-button" type="button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>לפרטי ההזמנה <ChevronLeft /></button>
                <button className="clear-cart" type="button" onClick={clear}>ריקון העגלה</button>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="overlay overlay--centered" role="presentation">
          <section ref={checkoutDialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <OrderProgress activeStep={3} />
            <div className="drawer-heading"><div><span>כמעט סיימנו</span><h2 id="checkout-title">פרטי ההזמנה</h2></div><button ref={checkoutCloseRef} type="button" onClick={() => setCheckoutOpen(false)} aria-label="סגירת פרטי ההזמנה"><X /></button></div>
            <form
              noValidate
              onSubmit={submitOrder}
              onFocusCapture={(event) => {
                if (checkoutStartedRef.current || !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
                checkoutStartedRef.current = true;
                trackLeadEvent({
                  name: 'nis_lead_form_start',
                  properties: { form_id: 'contact' },
                });
              }}
            >
              <div className="checkout-fields">
                <label>שם מלא<input name="name" autoComplete="name" required /></label>
                <label>טלפון<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required /></label>
                <label><span><MapPin /> תאריך האירוע</span><input name="date" type="date" required /></label>
                <label><span><Clock3 /> שעת האירוע</span><input name="time" type="time" /></label>
              </div>
              <fieldset className="fulfillment-options"><legend>איך מקבלים את ההזמנה?</legend><label><input name="fulfillment" type="radio" value="איסוף עצמי" checked={fulfillment === 'איסוף עצמי'} onChange={(event) => setFulfillment(event.target.value)} /><span>איסוף עצמי</span></label><label><input name="fulfillment" type="radio" value="משלוח" checked={fulfillment === 'משלוח'} onChange={(event) => setFulfillment(event.target.value)} /><span>משלוח</span></label></fieldset>
              {fulfillment === 'משלוח' ? <label><span><MapPin /> כתובת למשלוח</span><input name="address" autoComplete="street-address" required /></label> : null}
              <label>פרטים / הערות<textarea name="notes" rows={4} /></label>
              <div className="checkout-order-lines" role="group" aria-label="סיכום הפריטים"><h3>סיכום ההזמנה</h3><ul>{lines.map((line) => <li key={line.product.seq}><span>{line.product.name} ×{line.quantity}</span><b>{line.lineTotal === null ? line.product.priceLabel : `${formatPrice(line.lineTotal)} ₪`}</b></li>)}</ul></div>
              <div className="checkout-summary"><span>{itemCount} פריטים{hasCustomPricing ? ' · כולל תמחור אישי' : ''}</span><strong>{formatPrice(total)} ₪</strong></div>
              <button ref={termsTriggerRef} className="terms-link" type="button" onClick={() => setTermsOpen(true)}>לקריאת תנאי ההזמנה</button>
              <label className="terms-check"><input name="terms" type="checkbox" required /><span><Check /> קראתי את תנאי ההזמנה</span></label>
              <button className="whatsapp-submit" type="submit"><MessageCircle /> שליחת הזמנה ב־WhatsApp</button>
            </form>
          </section>
        </div>
      ) : null}

      {termsOpen ? (
        <div className="overlay overlay--centered overlay--top" role="presentation">
          <section ref={termsDialogRef} className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title">
            <div className="drawer-heading"><h2 id="terms-title">תנאי הזמנה ותשלום</h2><button ref={termsCloseRef} type="button" onClick={() => setTermsOpen(false)} aria-label="סגירת התנאים"><X /></button></div>
            <ul>{orderTerms.map((term) => <li key={term}>{term}</li>)}</ul>
            <button className="primary-order-button" type="button" onClick={() => setTermsOpen(false)}>הבנתי</button>
          </section>
        </div>
      ) : null}
      {toast ? <div className={`cart-toast${cartOpen || checkoutOpen || termsOpen ? ' cart-toast--with-overlay' : ''}`} role="status"><Check /> {toast}</div> : null}
    </div>
  );
};
