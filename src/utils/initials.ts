/**
 * Canonical avatar-initials helpers (S22 consolidation of the copies that
 * lived in digitalAgentStore, RoleDisplay, SmartImage, and the deliberation
 * fixtures).
 */

/**
 * Initials from a display string: "Amani Otieno" → "AO", a single word gives
 * its first two letters ("Amani" → "AM"), empty input gives ''.
 */
export function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Initials from profile fields, falling back to the first characters of a
 * public key (or "?") when no name is set.
 */
export function initialsFromProfile(
  firstName?: string,
  lastName?: string,
  key?: string,
): string {
  const label = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (label) return initialsOf(label);
  return (key || '?').slice(0, 2).toUpperCase();
}
