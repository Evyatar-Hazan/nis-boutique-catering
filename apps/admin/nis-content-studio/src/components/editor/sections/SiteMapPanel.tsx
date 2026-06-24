import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { PanelHeader } from '../PanelHeader';

type PreviewDevice = 'desktop' | 'mobile';

type SiteAreaDefinition = {
  readonly id: string;
  readonly title: string;
  readonly help: string;
  readonly location: string;
  readonly icon: ReactNode;
  readonly editorView?: string;
};

type SiteMapPanelProps = {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly onOpen: (view: string) => void;
  readonly areaDefinitions: readonly SiteAreaDefinition[];
  readonly areaStatus: (areaId: string, content: ContentSnapshot) => string;
  readonly renderAreaPreview: (args: {
    readonly area: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  }) => ReactNode;
};

export const SiteMapPanel = ({
  content,
  mediaById,
  onOpen,
  areaDefinitions,
  areaStatus,
  renderAreaPreview,
}: SiteMapPanelProps) => (
  <section className="workspace-panel">
    <PanelHeader title="מפת האתר" text="כל כרטיס מציג תיאור קצר ובצידו תצוגת דסקטופ ותצוגת מובייל של אותו אזור, כדי לראות את התוצאה בלי להיכנס קודם למסך העריכה." />
    <div className="site-map-grid">
      {areaDefinitions.map((area) => (
        <article className="site-area-card site-area-card-rich" key={area.id}>
          <div className="site-area-card-header">
            <div className="site-area-card-copy">
              <div className="site-area-icon">{area.icon}</div>
              <div>
                <p className="kicker">{area.location}</p>
                <h3>{area.title}</h3>
                <p>{area.help}</p>
              </div>
            </div>
            <div className="site-area-card-actions">
              <span>{areaStatus(area.id, content)}</span>
              <button className="compact-button" onClick={() => onOpen(area.editorView ?? area.id)}>עריכה</button>
            </div>
          </div>
          {renderAreaPreview({ area: area.id, content, mediaById })}
        </article>
      ))}
    </div>
  </section>
);

type SiteMapAreaPreviewProps = {
  readonly area: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly renderAreaSurface: (args: {
    readonly area: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const SiteMapAreaPreview = ({
  area,
  content,
  mediaById,
  renderAreaSurface,
}: SiteMapAreaPreviewProps) => (
  <div className="site-map-preview-shell">
    <div className="site-map-preview-pane site-map-preview-pane-desktop">
      <p className="site-map-preview-label">תצוגת מחשב</p>
      <div className="site-map-embedded-preview">
        {renderAreaSurface({ area, content, mediaById, device: 'desktop' })}
      </div>
    </div>
    <div className="site-map-preview-pane site-map-preview-pane-mobile">
      <p className="site-map-preview-label">תצוגת מובייל</p>
      <div className="site-map-embedded-preview">
        {renderAreaSurface({ area, content, mediaById, device: 'mobile' })}
      </div>
    </div>
  </div>
);

type SiteMapAreaPreviewSurfaceProps = {
  readonly area: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
  readonly areaDefinitions: readonly SiteAreaDefinition[];
  readonly exactPreviewSectionGroupIds: readonly string[];
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
  readonly renderSiteCopyOverviewPreview: (args: {
    readonly content: ContentSnapshot;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderSiteMicrocopyOverviewPreview: (args: {
    readonly content: ContentSnapshot;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderMetadataPreview: (args: {
    readonly content: ContentSnapshot;
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const SiteMapAreaPreviewSurface = ({
  area,
  content,
  mediaById,
  device,
  areaDefinitions,
  exactPreviewSectionGroupIds,
  renderHeroPreview,
  renderIntroBandPreview,
  renderManifestoPreview,
  renderExperienceLabPreview,
  renderServicesPreview,
  renderGalleryPreview,
  renderRealMediaPreview,
  renderContactPreview,
  renderSectionGroupPreview,
  renderSiteCopyOverviewPreview,
  renderSiteMicrocopyOverviewPreview,
  renderMetadataPreview,
}: SiteMapAreaPreviewSurfaceProps) => {
  const allSections = content.sections.filter((section) => !section.deletedAt);
  const title = areaDefinitions.find((definition) => definition.id === area)?.title ?? 'אזור באתר';
  const hero = content.sections.find((section) => section.id === 'hero' && section.active && !section.deletedAt);

  if (area === 'hero' && hero) {
    return renderHeroPreview({ content, hero, device, mediaById });
  }

  if (area === 'intro-band') {
    return renderIntroBandPreview({ content, device, mediaById });
  }

  if (area === 'manifesto') {
    return renderManifestoPreview({ content, mediaById, device });
  }

  if (area === 'experience-lab') {
    return renderExperienceLabPreview({ content, mediaById, device });
  }

  if (area === 'services') {
    return renderServicesPreview({ content, mediaById, device });
  }

  if (area === 'gallery') {
    return renderGalleryPreview({ content, mediaById, device });
  }

  if (area === 'real-media') {
    return renderRealMediaPreview({ content, mediaById, device });
  }

  if (area === 'contact') {
    return renderContactPreview({ content, mediaById, device });
  }

  if (exactPreviewSectionGroupIds.some((group) => group === area)) {
    const group = area;
    const sections = content.sections
      .filter((section) => section.group === group)
      .sort((left, right) => left.order - right.order);
    return renderSectionGroupPreview({
      group,
      title,
      content,
      mediaById,
      sections,
      allSections,
      device,
    });
  }

  if (area === 'site-copy') {
    return renderSiteCopyOverviewPreview({ content, device });
  }

  if (area === 'site-microcopy') {
    return renderSiteMicrocopyOverviewPreview({ content, device });
  }

  return renderMetadataPreview({ content, device });
};
