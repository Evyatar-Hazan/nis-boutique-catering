import type { SectionBlockRecord } from '@monorepo/content-schema';
import { Field } from '../Field';
import { TextInput } from '../TextInput';

type SectionCopyFieldsProps = {
  readonly section: SectionBlockRecord;
  readonly onUpdate: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly patchSectionItem: (section: SectionBlockRecord, index: number, value: string, fallback: string) => Partial<SectionBlockRecord>;
  readonly eyebrowFallback: string;
  readonly eyebrowLabel: string;
  readonly eyebrowHelp: string;
  readonly titleLabel: string;
  readonly titleHelp: string;
  readonly textLabel: string;
  readonly textHelp: string;
};

export const SectionCopyFields = ({
  section,
  onUpdate,
  patchSectionItem,
  eyebrowFallback,
  eyebrowLabel,
  eyebrowHelp,
  titleLabel,
  titleHelp,
  textLabel,
  textHelp,
}: SectionCopyFieldsProps) => (
  <>
    <Field label={eyebrowLabel} help={eyebrowHelp}>
      <TextInput
        value={section.items[0] ?? ''}
        onChange={(value) => onUpdate(section.id, patchSectionItem(section, 0, value, eyebrowFallback))}
      />
    </Field>
    <Field label={titleLabel} help={titleHelp}>
      <textarea value={section.title ?? ''} onChange={(event) => onUpdate(section.id, { title: event.target.value || undefined })} />
    </Field>
    <Field label={textLabel} help={textHelp}>
      <textarea value={section.text ?? ''} onChange={(event) => onUpdate(section.id, { text: event.target.value || undefined })} />
    </Field>
  </>
);
