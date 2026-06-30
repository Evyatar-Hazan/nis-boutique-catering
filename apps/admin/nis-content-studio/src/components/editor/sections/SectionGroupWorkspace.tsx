import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import type { ReactNode } from 'react';
import type { PreviewDevice } from '../types';
import { SectionGroupEditor } from './SectionGroupEditor';
import type { SectionGroupWorkspaceDefinition } from './sectionGroupWorkspaceDefinitions';

type SectionGroupWorkspaceProps = {
  readonly definition: SectionGroupWorkspaceDefinition;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly duplicateSection: (section: SectionBlockRecord) => void;
  readonly archiveSection: (id: string) => void;
  readonly restoreSection: (id: string) => void;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly sectionGroupLabels: Readonly<Record<string, string>>;
  readonly joinPipeList: (items: readonly string[]) => string;
  readonly splitPipeList: (value: string) => string[];
  readonly renderItemActions: (args: {
    readonly section: SectionBlockRecord;
    readonly onDuplicate: () => void;
    readonly onArchive: () => void;
    readonly onRestore: () => void;
  }) => ReactNode;
  readonly renderPreview: (args: {
    readonly group: string;
    readonly title: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly sections: readonly SectionBlockRecord[];
    readonly allSections: readonly SectionBlockRecord[];
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const SectionGroupWorkspace = ({
  definition,
  ...editorProps
}: SectionGroupWorkspaceProps) => (
  <SectionGroupEditor
    title={definition.title}
    text={definition.text}
    group={definition.group}
    {...editorProps}
  />
);
