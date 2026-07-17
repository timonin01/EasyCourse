/** Removes internal agent hints like "(section 1)" / "(lessonHint: 2)" from user-facing plan text. */
export function sanitizePlanMessage(message: string | null | undefined): string {
  if (!message) {
    return '';
  }
  return message
    .replace(/\s*\((?:section|lesson|step)(?:Hint)?\s*:?\s*[^)]*\)/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
