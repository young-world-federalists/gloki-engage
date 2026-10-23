// S42 — which of the beta's three doors the newcomer walked through.
//
// Chosen on the pre-auth doors page, read once by the onboarding flow to
// preselect the account kind. localStorage-backed like welcomeHints.ts so it
// survives the login round-trip; cleared when the user goes back to the doors.
import type { AccountKind } from '../../services/interfaces';

const KEY = 'gloki.beta.door';

export function getBetaDoor(): AccountKind | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === 'person' || raw === 'organisation' || raw === 'contributor' ? raw : null;
  } catch {
    return null;
  }
}

export function setBetaDoor(kind: AccountKind | null): void {
  try {
    if (kind) localStorage.setItem(KEY, kind);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore persistence failure (private mode) */
  }
}
