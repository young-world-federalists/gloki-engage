// Tab-lifetime notification orchestration. The public UI boundary is
// src/services/notifications.ts; components and contexts never import here.
import type { NotificationOwner } from '../notificationEvents';
import { demoPrimeRequestNotifications } from './verificationDemo';
import {
  simExpireCallOffers,
  simForgetExpiredCallOffers,
  simOfferCallInvite,
  simRestoreCallOffers,
} from './verificationSim';

type TimerHandle = ReturnType<typeof setTimeout>;
interface RuntimeEntry { cleanupTimer: TimerHandle | null }
const runtimes = new Map<string, RuntimeEntry>();

function ownerKey(owner: NotificationOwner): string {
  return `${encodeURIComponent(owner.serverUrl)}::${owner.publicKey}`;
}

/** Starts the deterministic W1/W2 producers for the authenticated owner. */
export function startDemoNotificationRuntime(owner: NotificationOwner): () => void {
  const key = ownerKey(owner);
  const entry = runtimes.get(key) ?? { cleanupTimer: null };
  if (entry.cleanupTimer) {
    clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = null;
    simRestoreCallOffers(owner);
  }
  runtimes.set(key, entry);
  demoPrimeRequestNotifications(owner);
  simOfferCallInvite(owner);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    // Expire while this owner is still the hydrated scope. Keep the private
    // record for one task so StrictMode's immediate remount can restore it.
    simExpireCallOffers(owner);
    entry.cleanupTimer = setTimeout(() => {
      simForgetExpiredCallOffers(owner);
      runtimes.delete(key);
    }, 0);
  };
}
