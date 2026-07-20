import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ImageAsset } from '../sitePreviewTypes';
import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';

export type IconComponent = LucideIcon;

export interface IconTextItemProps {
  readonly icon: IconComponent;
  readonly text: string;
  readonly title: string;
}

export const IconTextItem = ({ icon: Icon, text, title }: IconTextItemProps) => (
  <article className="icon-text-item">
    <Icon aria-hidden="true" className="card-icon" />
    <h3>{title}</h3>
    <p>{text}</p>
  </article>
);

export interface MediaCardProps {
  readonly alt: string;
  readonly children?: ReactNode;
  readonly image: ImageAsset;
  readonly title: string;
}

export const MediaCard = ({ alt, children, image, title }: MediaCardProps) => (
  <article
    className="media-card reveal"
    data-reveal-duration="680"
    data-reveal-threshold="0.1"
    data-reveal-variant="card"
  >
    <OptimizedImage alt={alt} image={image} loading="lazy" decoding="async" />
    <div className="media-card__copy"><h3>{title}</h3>{children}</div>
  </article>
);

export interface ServiceCardProps {
  readonly bestFor: string;
  readonly ctaHref: string;
  readonly ctaLabel: string;
  readonly description: string;
  readonly image: ImageAsset;
  readonly imageAlt: string;
  readonly title: string;
}

export const ServiceCard = ({ bestFor, ctaHref, ctaLabel, description, image, imageAlt, title }: ServiceCardProps) => (
  <MediaCard alt={imageAlt} image={image} title={title}>
    <p>{description}</p>
    <p className="service-card__fit"><strong>מתאים במיוחד:</strong> {bestFor}</p>
    <Button href={ctaHref} size="compact">{ctaLabel}</Button>
  </MediaCard>
);
