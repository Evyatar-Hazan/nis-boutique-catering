import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import {
  SiteCopyOverviewPreview,
  SiteMicrocopyOverviewPreview,
} from './OverviewPreviews';
import {
  SiteMapAreaPreview,
  SiteMapAreaPreviewSurface,
  SiteMapPanel,
} from './SiteMapPanel';
import type { PreviewDevice } from '../types';
import type { ActiveView } from '../../../publishWorkflowHelpers';

type SiteAreaDefinition = {
  readonly id: ActiveView;
  readonly title: string;
  readonly location: string;
  readonly help: string;
  readonly icon: ReactNode;
  readonly editorView?: ActiveView;
};

type SiteMapWorkspaceProps = {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly setActiveView: (view: ActiveView) => void;
  readonly areaDefinitions: readonly SiteAreaDefinition[];
  readonly getAreaStatus: (areaId: ActiveView, content: ContentSnapshot) => string;
  readonly exactPreviewSectionGroupIds: readonly string[];
  readonly sectionGroupLabels: Readonly<Record<string, string>>;
  readonly getPreviewMicrocopy: (content: ContentSnapshot, id: string, fallback: string) => string;
  readonly renderHeroPreview: (args: {
    readonly content: ContentSnapshot;
    readonly hero: SectionBlockRecord;
    readonly device: PreviewDevice;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  }) => ReactNode;
  readonly renderIntroBandPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderManifestoPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderExperienceLabPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderServicesPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderGalleryPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderRealMediaPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderContactPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderSectionGroupPreview: (args: {
    readonly group: string;
    readonly title: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly sections: readonly SectionBlockRecord[];
    readonly allSections: readonly SectionBlockRecord[];
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderBrowserBar: (device: PreviewDevice) => ReactNode;
  readonly renderMetadataPreview: (args: {
    readonly content: ContentSnapshot;
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const SiteMapWorkspace = ({
  content,
  mediaById,
  setActiveView,
  areaDefinitions,
  getAreaStatus,
  exactPreviewSectionGroupIds,
  sectionGroupLabels,
  getPreviewMicrocopy,
  renderHeroPreview,
  renderIntroBandPreview,
  renderManifestoPreview,
  renderExperienceLabPreview,
  renderServicesPreview,
  renderGalleryPreview,
  renderRealMediaPreview,
  renderContactPreview,
  renderSectionGroupPreview,
  renderBrowserBar,
  renderMetadataPreview,
}: SiteMapWorkspaceProps) => (
  <SiteMapPanel
    content={content}
    mediaById={mediaById}
    onOpen={(view) => setActiveView(view as ActiveView)}
    areaDefinitions={areaDefinitions}
    areaStatus={(areaId, nextContent) => getAreaStatus(areaId as ActiveView, nextContent)}
    renderAreaPreview={({ area, content: previewContent, mediaById: previewMediaById }) => (
      <SiteMapAreaPreview
        area={area}
        content={previewContent}
        mediaById={previewMediaById}
        renderAreaSurface={({ area, content: surfaceContent, mediaById: surfaceMediaById, device }) => (
          <SiteMapAreaPreviewSurface
            area={area}
            content={surfaceContent}
            mediaById={surfaceMediaById}
            device={device}
            areaDefinitions={areaDefinitions}
            exactPreviewSectionGroupIds={exactPreviewSectionGroupIds}
            renderHeroPreview={renderHeroPreview}
            renderIntroBandPreview={renderIntroBandPreview}
            renderManifestoPreview={renderManifestoPreview}
            renderExperienceLabPreview={renderExperienceLabPreview}
            renderServicesPreview={renderServicesPreview}
            renderGalleryPreview={renderGalleryPreview}
            renderRealMediaPreview={renderRealMediaPreview}
            renderContactPreview={renderContactPreview}
            renderSectionGroupPreview={renderSectionGroupPreview}
            renderSiteCopyOverviewPreview={({ content: copyContent, device }) => (
              <SiteCopyOverviewPreview
                content={copyContent}
                device={device}
                sectionGroupLabels={sectionGroupLabels}
                renderBrowserBar={renderBrowserBar}
              />
            )}
            renderSiteMicrocopyOverviewPreview={({ content: microcopyContent, device }) => (
              <SiteMicrocopyOverviewPreview
                content={microcopyContent}
                device={device}
                renderBrowserBar={renderBrowserBar}
                getPreviewMicrocopy={getPreviewMicrocopy}
              />
            )}
            renderMetadataPreview={renderMetadataPreview}
          />
        )}
      />
    )}
  />
);
