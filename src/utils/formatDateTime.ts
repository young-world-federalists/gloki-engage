/**
 * Locale-aware absolute date+time, e.g. "Jul 6, 2026, 09:30" (S22
 * consolidation of the identical copies in ChatTopic and ThreadedDiscussion).
 * For relative time ("2d ago") use formatTimeAgo instead.
 */
export function formatDateTime(ts: number, locale: string): string {
  return new Date(ts).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
