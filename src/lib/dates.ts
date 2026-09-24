/**
 * Shared date formatting for found items (matches the v3 mock copy:
 * "Today, 9:40 AM" / "Sep 22").
 */

/** "Today, 9:40 AM" for today, else "Sep 22, 3:05 PM". Drops the time with `withTime=false`. */
export function formatFoundDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const today = date.toDateString() === now.toDateString();
  const datePart = today
    ? 'Today'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (!withTime) return datePart;
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart}, ${time}`;
}

/**
 * Parse a user-typed date string (e.g. "Sep 24, 2026") to an ISO timestamp,
 * falling back to `now` when the text isn't a valid date.
 */
export function toIsoStringOrNow(text: string): string {
  const parsed = Date.parse(text.trim());
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}
