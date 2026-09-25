/**
 * Pure helpers shared across screens (kept dependency-free so they're
 * trivially unit-testable — session.tsx re-exports initialsOf).
 */

/** "Alex Morgan" → "AM"; falls back to "CA" (ClaimIt). Used for avatars. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CA';
  const initials = parts
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'CA';
}
