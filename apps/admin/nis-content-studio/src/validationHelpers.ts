export const formatValidationIssue = (issue: { readonly path: readonly PropertyKey[]; readonly message: string }) => {
  const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'התוכן הכללי';
  const message = issue.message === 'Invalid input' ? 'ערך לא תקין' : issue.message;
  return `שדה לא תקין: ${path} - ${message}`;
};
