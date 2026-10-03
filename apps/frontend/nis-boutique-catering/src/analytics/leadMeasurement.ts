export const LEAD_EVENT_SCHEMA_VERSION = 1 as const;

export const whatsappSources = [
  'topbar',
  'hero',
  'services',
  'contact',
  'footer',
  'floating',
  'mobile_sticky',
  'lead_form',
] as const;

export type WhatsappSource = (typeof whatsappSources)[number];

const ctaIds = [
  'topbar_whatsapp',
  'hero_whatsapp',
  'services_whatsapp',
  'contact_whatsapp',
  'footer_whatsapp',
  'floating_whatsapp',
  'mobile_sticky_whatsapp',
] as const;

type CtaId = (typeof ctaIds)[number];

export type LeadMeasurementEvent =
  | {
      readonly name: 'nis_cta_click';
      readonly properties: {
        readonly cta_id: CtaId;
        readonly destination: 'whatsapp';
      };
    }
  | {
      readonly name: 'nis_lead_form_start';
      readonly properties: { readonly form_id: 'contact' };
    }
  | {
      readonly name: 'nis_lead_form_validation';
      readonly properties: {
        readonly form_id: 'contact';
        readonly invalid_field_count: number;
        readonly result: 'valid' | 'invalid';
      };
    }
  | {
      readonly name: 'nis_lead_form_submit_success';
      readonly properties: {
        readonly form_id: 'contact';
        readonly next_step: 'whatsapp_handoff';
      };
    }
  | {
      readonly name: 'nis_whatsapp_handoff';
      readonly properties: {
        readonly origin: 'direct' | 'lead_form';
        readonly source: WhatsappSource;
      };
    };

export type LeadMeasurementEnvelope = LeadMeasurementEvent & {
  readonly schema_version: typeof LEAD_EVENT_SCHEMA_VERSION;
};

export type LeadMeasurementSink = (event: LeadMeasurementEnvelope) => void;

const localEventSink: LeadMeasurementSink = (event) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<LeadMeasurementEnvelope>('nis:lead-measurement', {
      detail: event,
    }),
  );
};

let activeSink: LeadMeasurementSink = localEventSink;

export const trackLeadEvent = (event: LeadMeasurementEvent): void => {
  activeSink(
    Object.freeze({
      ...event,
      properties: Object.freeze({ ...event.properties }),
      schema_version: LEAD_EVENT_SCHEMA_VERSION,
    }) as LeadMeasurementEnvelope,
  );
};

export const setLeadMeasurementSink = (sink: LeadMeasurementSink): (() => void) => {
  const previousSink = activeSink;
  activeSink = sink;
  return () => {
    activeSink = previousSink;
  };
};

const isCtaId = (value: string | undefined): value is CtaId =>
  ctaIds.includes(value as CtaId);

const isWhatsappSource = (value: string | undefined): value is WhatsappSource =>
  whatsappSources.includes(value as WhatsappSource);

export const trackMeasuredCtaClick = (target: EventTarget | null): void => {
  if (!(target instanceof Element)) return;

  const measuredLink = target.closest<HTMLElement>('[data-measurement-cta]');
  if (!measuredLink) return;

  const ctaId = measuredLink.dataset.measurementCta;
  const source = measuredLink.dataset.measurementWhatsappSource;
  if (!isCtaId(ctaId) || !isWhatsappSource(source)) return;

  trackLeadEvent({
    name: 'nis_cta_click',
    properties: { cta_id: ctaId, destination: 'whatsapp' },
  });
  trackLeadEvent({
    name: 'nis_whatsapp_handoff',
    properties: { origin: 'direct', source },
  });
};
