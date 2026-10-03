import { describe, expect, it, vi } from 'vitest';
import {
  setLeadMeasurementSink,
  trackLeadEvent,
  trackMeasuredCtaClick,
  type LeadMeasurementEnvelope,
} from './leadMeasurement';

describe('lead measurement', () => {
  it('emits only the allowlisted CTA metadata and never the destination URL', () => {
    const events: LeadMeasurementEnvelope[] = [];
    const restore = setLeadMeasurementSink((event) => events.push(event));
    const link = document.createElement('a');
    link.href = 'https://wa.me/972500000000?text=private-message';
    link.dataset.measurementCta = 'hero_whatsapp';
    link.dataset.measurementWhatsappSource = 'hero';
    const child = document.createElement('span');
    link.append(child);

    trackMeasuredCtaClick(child);
    restore();

    expect(events).toEqual([
      {
        name: 'nis_cta_click',
        properties: { cta_id: 'hero_whatsapp', destination: 'whatsapp' },
        schema_version: 1,
      },
      {
        name: 'nis_whatsapp_handoff',
        properties: { origin: 'direct', source: 'hero' },
        schema_version: 1,
      },
    ]);
    expect(JSON.stringify(events)).not.toContain('private-message');
    expect(JSON.stringify(events)).not.toContain('wa.me');
  });

  it('ignores unrecognized DOM metadata instead of forwarding arbitrary values', () => {
    const sink = vi.fn();
    const restore = setLeadMeasurementSink(sink);
    const link = document.createElement('a');
    link.dataset.measurementCta = 'attacker_controlled';
    link.dataset.measurementWhatsappSource = 'unknown';

    trackMeasuredCtaClick(link);
    restore();

    expect(sink).not.toHaveBeenCalled();
  });

  it('publishes the privacy-safe local form result without field values', () => {
    const sink = vi.fn();
    const restore = setLeadMeasurementSink(sink);

    trackLeadEvent({
      name: 'nis_lead_form_validation',
      properties: { form_id: 'contact', invalid_field_count: 2, result: 'invalid' },
    });
    restore();

    expect(sink).toHaveBeenCalledWith({
      name: 'nis_lead_form_validation',
      properties: { form_id: 'contact', invalid_field_count: 2, result: 'invalid' },
      schema_version: 1,
    });
  });
});
