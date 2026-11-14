import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { businessContact } from '@monorepo/content-schema';
import type { CatalogProduct } from '../../data/products.js';
import { useOrderCart } from '../hooks/useOrderCart';
import { trackLeadEvent } from '../analytics/leadMeasurement';

const formatPrice = (value: number) => new Intl.NumberFormat('he-IL').format(value);

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
  'כל המוצרים בכשרות בד״ץ העדה החרדית והרב לנדא. ייתכנו שינויים בהתאם למלאי ולעונה.',
] as const;

interface ProductCardProps {
  readonly product: CatalogProduct;
  readonly onAdd: (quantity: number) => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  return (
    <article className="product-card" data-product-seq={product.seq}>
      <div className={`product-media${product.images.length > 1 ? ' product-media--split' : ''}`}>
        {product.images.map((image, index) => (
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
          <h3>{product.name}</h3>
          <p className="product-price">
            <bdi>{formatPrice(product.priceIls)} ₪</bdi>
            {product.priceUnit === 'per_unit' ? <span>ליחידה</span> : null}
          </p>
        </div>
        {product.description ? <p className="product-description">{product.description}</p> : null}
        <p className="product-kosher">בד״ץ העדה החרדית והרב לנדא</p>
        <div className="product-actions">
          <div className="quantity-stepper" aria-label={`כמות עבור ${product.name}`}>
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={`הפחת כמות של ${product.name}`}><Minus /></button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label={`הוסף כמות של ${product.name}`}><Plus /></button>
          </div>
          <button className="add-to-cart" type="button" onClick={() => { onAdd(quantity); setQuantity(1); }}>
            הוספה לעגלה <ChevronLeft aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

interface OrderingSiteProps {
  readonly catalog: readonly CatalogProduct[];
}

export const OrderingSite = ({ catalog }: OrderingSiteProps) => {
  const categories = useMemo(() => [...new Set(catalog.map((product) => product.category))], [catalog]);
  const { add, clear, itemCount, lines, setQuantity, total } = useOrderCart(catalog);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const cartCloseRef = useRef<HTMLButtonElement>(null);
  const checkoutStartedRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle('has-order-overlay', cartOpen || checkoutOpen || termsOpen);
    return () => document.body.classList.remove('has-order-overlay');
  }, [cartOpen, checkoutOpen, termsOpen]);

  useEffect(() => {
    if (cartOpen) cartCloseRef.current?.focus();
  }, [cartOpen]);

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
    const notes = String(formData.get('notes') ?? '').trim();
    const itemLines = lines.map((line, index) =>
      `${index + 1}. ${line.product.name} ×${line.quantity} — ${formatPrice(line.lineTotal)} ₪`,
    );
    const message = [
      'הזמנה חדשה מהאתר — NIS Boutique Catering', '',
      `שם: ${name}`, `טלפון: ${phone}`, `תאריך האירוע: ${date}`, `פרטים: ${notes || 'ללא'}`, '',
      'פריטים:', ...itemLines, '', `סה״כ: ${formatPrice(total)} ₪`,
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
        <a className="ordering-brand" href="#top" aria-label="NIS Boutique Catering — ראש העמוד">
          <span className="ordering-brand__mark">nis</span><span>BOUTIQUE CATERING</span>
        </a>
        <button className="header-cart" type="button" onClick={() => setCartOpen(true)}>
          <ShoppingBag aria-hidden="true" /><span>העגלה שלי</span><strong>{itemCount}</strong>
        </button>
      </header>

      <main>
        <section className="ordering-hero" id="top">
          <span className="hero-shape hero-shape--one" aria-hidden="true" />
          <span className="hero-shape hero-shape--two" aria-hidden="true" />
          <div className="ordering-hero__content">
            <p className="hero-kosher">בד״ץ העדה החרדית והרב לנדא</p>
            <img src="/brand/logo-nis-ordering.png" alt="NIS Boutique Catering" />
            <h1>תפריט בוטיק חלבי</h1>
            <p className="hero-slogan">אסתטי. בטוב טעם.</p>
            <a className="hero-cta" href="#catalog">לתפריט</a>
            <a className="hero-phone" href={businessContact.phoneHref}>{businessContact.phoneDisplay}</a>
          </div>
        </section>

        <nav className="category-nav" aria-label="קטגוריות התפריט">
          <div>{categories.map((category) => <a key={category} href={`#category-${category}`}>{category}</a>)}</div>
        </nav>

        <section className="catalog-intro" id="catalog" aria-labelledby="catalog-title">
          <p>בוחרים, מוסיפים ושולחים</p>
          <h2 id="catalog-title">האירוח שלכם מתחיל כאן.</h2>
          <span>{catalog.length} מוצרים לבחירה</span>
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
                  <ProductCard key={product.seq} product={product} onAdd={(quantity) => add(product.seq, quantity)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="ordering-steps" aria-labelledby="steps-title">
          <p>ומכאן זה פשוט</p><h2 id="steps-title">שלושה צעדים וההזמנה בדרך.</h2>
          <ol>
            <li><b>1</b><div><h3>בוחרים מהתפריט</h3><p>מוסיפים לעגלה ומשנים כמויות בקלות.</p></div></li>
            <li><b>2</b><div><h3>ממלאים פרטים</h3><p>שם, טלפון, תאריך וכל מה שחשוב לנו לדעת.</p></div></li>
            <li><b>3</b><div><h3>שולחים ב־WhatsApp</h3><p>ההזמנה מגיעה מוכנה לשיחה ולאישור.</p></div></li>
          </ol>
        </section>
      </main>

      <footer className="ordering-footer">
        <div className="ordering-brand ordering-brand--footer"><span className="ordering-brand__mark">nis</span><span>BOUTIQUE CATERING</span></div>
        <p>תפריט בוטיק חלבי — אסתטי. בטוב טעם.</p>
        <a href={businessContact.phoneHref}>{businessContact.phoneDisplay}</a>
        <a href="/accessibility/">הצהרת נגישות</a>
      </footer>

      <button className="floating-cart" type="button" onClick={() => setCartOpen(true)}>
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
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
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
                      <img src={`/images/${line.product.images[0]}`} alt="" />
                      <div><h3>{line.product.name}</h3><span>{formatPrice(line.lineTotal)} ₪</span></div>
                      <div className="cart-line-actions">
                        <button type="button" onClick={() => setQuantity(line.product.seq, line.quantity - 1)} aria-label={`הפחת ${line.product.name}`}><Minus /></button>
                        <output>{line.quantity}</output>
                        <button type="button" onClick={() => setQuantity(line.product.seq, line.quantity + 1)} aria-label={`הוסף ${line.product.name}`}><Plus /></button>
                        <button type="button" onClick={() => setQuantity(line.product.seq, 0)} aria-label={`מחק ${line.product.name}`}><Trash2 /></button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-total"><span>סה״כ</span><strong>{formatPrice(total)} ₪</strong></div>
                <button className="primary-order-button" type="button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>לפרטי ההזמנה <ChevronLeft /></button>
                <button className="clear-cart" type="button" onClick={clear}>ריקון העגלה</button>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="overlay overlay--centered" role="presentation">
          <section className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className="drawer-heading"><div><span>כמעט סיימנו</span><h2 id="checkout-title">פרטי ההזמנה</h2></div><button type="button" onClick={() => setCheckoutOpen(false)} aria-label="סגירת פרטי ההזמנה"><X /></button></div>
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
              <label>שם מלא<input name="name" autoComplete="name" required /></label>
              <label>טלפון<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required /></label>
              <label>תאריך האירוע<input name="date" type="date" required /></label>
              <label>פרטים / הערות<textarea name="notes" rows={4} /></label>
              <div className="checkout-summary"><span>{itemCount} פריטים</span><strong>{formatPrice(total)} ₪</strong></div>
              <button className="terms-link" type="button" onClick={() => setTermsOpen(true)}>לקריאת תנאי ההזמנה</button>
              <label className="terms-check"><input name="terms" type="checkbox" required /><span><Check /> קראתי את תנאי ההזמנה</span></label>
              <button className="whatsapp-submit" type="submit">שליחת הזמנה ב־WhatsApp</button>
            </form>
          </section>
        </div>
      ) : null}

      {termsOpen ? (
        <div className="overlay overlay--centered overlay--top" role="presentation">
          <section className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title">
            <div className="drawer-heading"><h2 id="terms-title">תנאי הזמנה ותשלום</h2><button type="button" onClick={() => setTermsOpen(false)} aria-label="סגירת התנאים"><X /></button></div>
            <ul>{orderTerms.map((term) => <li key={term}>{term}</li>)}</ul>
            <button className="primary-order-button" type="button" onClick={() => setTermsOpen(false)}>הבנתי</button>
          </section>
        </div>
      ) : null}
    </div>
  );
};
