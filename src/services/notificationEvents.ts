import { store } from '../store';
import {
  buildNotificationsScope,
  setNotificationStatus,
  upsertNotification,
  type NotificationPayload,
  type NotificationStatus,
  type NotificationType,
} from '../store/slices/notificationsSlice';

export interface NotificationOwner {
  serverUrl: string;
  publicKey: string;
}

export interface NotificationEventInput {
  id: string;
  type: NotificationType;
  createdAt: number;
  status?: NotificationStatus;
  payload?: NotificationPayload;
}

function activeScope(owner: NotificationOwner): string | null {
  const scopeKey = buildNotificationsScope(owner.serverUrl, owner.publicKey);
  return store.getState().notifications.storageScope === scopeKey ? scopeKey : null;
}

/** Publish only while this owner is the hydrated notification recipient. */
export function publishNotification(owner: NotificationOwner, event: NotificationEventInput): void {
  const scopeKey = activeScope(owner);
  if (!scopeKey || !event.id.trim() || !Number.isFinite(event.createdAt) || event.createdAt <= 0) return;
  store.dispatch(upsertNotification({
    scopeKey,
    notification: {
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      status: event.status ?? 'active',
      payload: event.payload ?? {},
    },
  }));
}

/** Update only a notification owned by the currently hydrated recipient. */
export function updateNotificationEvent(
  owner: NotificationOwner,
  id: string,
  status: NotificationStatus,
  payload?: NotificationPayload,
): void {
  const scopeKey = activeScope(owner);
  if (!scopeKey || !id.trim()) return;
  store.dispatch(setNotificationStatus({ scopeKey, id, status, payload }));
}
