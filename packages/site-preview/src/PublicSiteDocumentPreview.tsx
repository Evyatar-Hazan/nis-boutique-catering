import type { PublicMediaAsset, PublicSiteDocument } from '@monorepo/content-schema';

const defaultMediaUrl = (asset: PublicMediaAsset): string =>
  `/api/content/media?id=${encodeURIComponent(asset.id)}`;

export const PublicSiteDocumentPreview = ({
  document,
  resolveMediaUrl = defaultMediaUrl,
}: {
  readonly document: PublicSiteDocument;
  readonly resolveMediaUrl?: (asset: PublicMediaAsset) => string;
}) => {
  const { contact, gallery, hero, process, services, trust } = document.sections;
  const mediaById = new Map(document.media.map((asset) => [asset.id, asset]));
  const image = (mediaId: string, className?: string) => {
    const asset = mediaById.get(mediaId);
    if (!asset || asset.kind !== 'image') return null;
    return <img
      alt={asset.alt}
      className={className}
      decoding="async"
      height={asset.height}
      loading="lazy"
      src={resolveMediaUrl(asset)}
      width={asset.width}
    />;
  };

  return <article className="public-document-preview" dir="rtl" aria-label="תצוגה מקדימה של האתר">
    <section className="public-preview-hero" aria-labelledby="public-preview-hero-title">
      <div>
        {hero.eyebrow && <p className="public-preview-eyebrow">{hero.eyebrow}</p>}
        <h1 id="public-preview-hero-title">{hero.title}</h1>
        <p>{hero.description}</p>
        <div className="public-preview-actions">
          <span>{hero.primaryCta.label}</span><span>{hero.secondaryCta.label}</span>
        </div>
        <ul>{hero.valuePoints.map((point) => <li key={point}>{point}</li>)}</ul>
      </div>
      {image(hero.mediaId, 'public-preview-featured-media')}
    </section>

    <section aria-labelledby="public-preview-services-title">
      {services.eyebrow && <p className="public-preview-eyebrow">{services.eyebrow}</p>}
      <h2 id="public-preview-services-title">{services.title}</h2>
      {services.description && <p>{services.description}</p>}
      <div className="public-preview-card-grid">
        {services.items.filter((item) => item.active).map((item) => <article key={item.id}>
          {image(item.mediaId)}<h3>{item.title}</h3><p>{item.summary}</p><small>{item.bestFor}</small>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="public-preview-gallery-title">
      {gallery.eyebrow && <p className="public-preview-eyebrow">{gallery.eyebrow}</p>}
      <h2 id="public-preview-gallery-title">{gallery.title}</h2>
      {gallery.description && <p>{gallery.description}</p>}
      <div className="public-preview-gallery">
        {gallery.items.map((item) => <figure key={item.id}>{image(item.mediaId)}<figcaption>{item.title}</figcaption></figure>)}
      </div>
    </section>

    <section aria-labelledby="public-preview-process-title">
      {process.eyebrow && <p className="public-preview-eyebrow">{process.eyebrow}</p>}
      <h2 id="public-preview-process-title">{process.title}</h2>
      {process.description && <p>{process.description}</p>}
      <ol className="public-preview-steps">
        {[...process.steps].sort((left, right) => left.order - right.order).map((step) => <li key={step.id}>
          <strong>{step.title}</strong><p>{step.description}</p>
        </li>)}
      </ol>
    </section>

    <section className="public-preview-trust" aria-labelledby="public-preview-trust-title">
      <div>
        {trust.eyebrow && <p className="public-preview-eyebrow">{trust.eyebrow}</p>}
        <h2 id="public-preview-trust-title">{trust.title}</h2>
        {trust.description && <p>{trust.description}</p>}
        {trust.points.map((point) => <article key={point.id}><h3>{point.title}</h3><p>{point.text}</p></article>)}
      </div>
      {image(trust.mediaId, 'public-preview-featured-media')}
    </section>

    <section aria-labelledby="public-preview-contact-title">
      {contact.eyebrow && <p className="public-preview-eyebrow">{contact.eyebrow}</p>}
      <h2 id="public-preview-contact-title">{contact.title}</h2>
      {contact.description && <p>{contact.description}</p>}
      <div className="public-preview-faqs">
        {contact.faqs.map((faq) => <details key={faq.id}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
      </div>
      <span className="public-preview-contact-cta">{contact.submitCta.label}</span>
    </section>
  </article>;
};
