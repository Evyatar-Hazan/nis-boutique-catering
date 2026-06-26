import type { ReactNode } from 'react';

type EditorSplitLayoutProps = {
  readonly editor: ReactNode;
  readonly preview: ReactNode;
  readonly className?: string;
  readonly editorClassName?: string;
  readonly previewClassName?: string;
  readonly previewFirst?: boolean;
};

export const EditorSplitLayout = ({
  editor,
  preview,
  className,
  editorClassName,
  previewClassName,
  previewFirst = false,
}: EditorSplitLayoutProps) => {
  const sectionClassName = className ? `workspace-panel split-editor ${className}` : 'workspace-panel split-editor';
  const editorPane = <div className={editorClassName ?? 'editor-column'}>{editor}</div>;
  const previewPane = <div className={previewClassName ?? 'preview-column'}>{preview}</div>;

  return (
    <section className={sectionClassName}>
      {previewFirst ? previewPane : editorPane}
      {previewFirst ? editorPane : previewPane}
    </section>
  );
};
