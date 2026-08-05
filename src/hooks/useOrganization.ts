import { useSyncExternalStore } from 'react';
import { getOrganization, invalidateOrganizationCache, type OrganizationActor } from '../services/organizationActor';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab signing in/out as an organization should flip this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'gloki.organization' || e.key === null) {
      // Re-read storage, or getSnapshot returns this tab's stale memo.
      invalidateOrganizationCache();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Call after saving/clearing the organization so mounted consumers re-read. */
export function notifyOrganizationChanged(): void {
  listeners.forEach((l) => l());
}

/**
 * S33 — is this session an organization, and which one?
 *
 * `isOrganization` is the single gate the rest of the app branches on:
 * organizations may READ everything but may only ACT on finished mandates
 * (endorse / subscribe). See `services/organizationActor.ts` for why.
 */
export function useOrganization(): { organization: OrganizationActor | null; isOrganization: boolean } {
  const organization = useSyncExternalStore(subscribe, getOrganization, getOrganization);
  return { organization, isOrganization: organization !== null };
}
