import { contentSnapshotSchema } from '@monorepo/content-schema';
import { formatValidationIssue } from './validationHelpers';

export const formatError = (error: unknown) => (error instanceof Error ? error.message : 'הפעולה נכשלה');

export const validationErrorText = (
  validation: ReturnType<typeof contentSnapshotSchema.safeParse>,
  referenceIssues: readonly string[],
) => {
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return issue ? formatValidationIssue(issue) : 'יש שדות שצריך לתקן.';
  }
  return referenceIssues[0] ?? 'יש שדות שצריך לתקן.';
};

export const getDriveFileViewUrl = (fileId: string) =>
  `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;

export const shortSourceId = (sourceId: string) => {
  if (sourceId.length <= 12) {
    return sourceId;
  }
  return `${sourceId.slice(0, 6)}...${sourceId.slice(-4)}`;
};
