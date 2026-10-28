// Tab-lifetime notification orchestration. The public UI boundary is
// src/services/notifications.ts; components and contexts never import here.
import { publishNotification, type NotificationOwner } from '../notificationEvents';
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

export interface DailyReminderRegistration {
  dayKey: string;
  joinOpensAt: number;
}

interface StoredReminder extends DailyReminderRegistration {
  owner: NotificationOwner;
  timer: TimerHandle | null;
}

const dailyReminders = new Map<string, StoredReminder>();

function ownerKey(owner: NotificationOwner): string {
  return `${encodeURIComponent(owner.serverUrl)}::${owner.publicKey}`;
}

function reminderKey(owner: NotificationOwner, dayKey: string): string {
  return `${ownerKey(owner)}::${dayKey}`;
}

function emitDailyReminder(reminder: StoredReminder): void {
  publishNotification(reminder.owner, {
    id: `daily-reminder:${reminder.dayKey}:${reminder.owner.publicKey}`,
    type: 'daily_reminder',
    createdAt: Date.now(),
    payload: { dayKey: reminder.dayKey },
  });
  reminder.timer = null;
}

/** Register one route-independent, tab-lifetime reminder for an owner/day. */
export function scheduleDemoDailyReminder(
  owner: NotificationOwner,
  registration: DailyReminderRegistration,
): void {
  const key = reminderKey(owner, registration.dayKey);
  const existing = dailyReminders.get(key);
  if (existing?.timer) clearTimeout(existing.timer);
  const reminder: StoredReminder = { ...registration, owner, timer: null };
  dailyReminders.set(key, reminder);
  const delay = registration.joinOpensAt - Date.now();
  if (delay <= 0) {
    emitDailyReminder(reminder);
    return;
  }
  reminder.timer = setTimeout(() => emitDailyReminder(reminder), delay);
}

export function cancelDemoDailyReminder(owner: NotificationOwner, dayKey: string): void {
  const key = reminderKey(owner, dayKey);
  const reminder = dailyReminders.get(key);
  if (reminder?.timer) clearTimeout(reminder.timer);
  dailyReminders.delete(key);
}

export function isDemoDailyReminderEnabled(owner: NotificationOwner, dayKey: string): boolean {
  return dailyReminders.has(reminderKey(owner, dayKey));
}

function cancelDemoDailyReminders(owner: NotificationOwner): void {
  const prefix = `${ownerKey(owner)}::`;
  for (const [key, reminder] of dailyReminders) {
    if (!key.startsWith(prefix)) continue;
    if (reminder.timer) clearTimeout(reminder.timer);
    dailyReminders.delete(key);
  }
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
      cancelDemoDailyReminders(owner);
      runtimes.delete(key);
    }, 0);
  };
}
