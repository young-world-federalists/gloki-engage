import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationType =
  | 'merge_absorbed'
  | 'verification_request'
  | 'call_invite'
  | 'approval_received'
  | 'daily_reminder'
  | 'verifier_selected'
  | 'session_thanks';

export type NotificationStatus = 'active' | 'consumed' | 'expired';
export type NotificationPayload = Record<string, string | number | boolean | null>;

export interface AppNotification {
  id: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  status: NotificationStatus;
  payload: NotificationPayload;
}

interface NotificationsState {
  items: AppNotification[];
  storageScope: string | null;
}

const LEGACY_STORAGE_KEY = 'communityNotifications';
const MAX_NOTIFICATIONS = 100;

const NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'merge_absorbed',
  'verification_request',
  'call_invite',
  'approval_received',
  'daily_reminder',
  'verifier_selected',
  'session_thanks',
]);

const NOTIFICATION_STATUSES: ReadonlySet<NotificationStatus> = new Set([
  'active',
  'consumed',
  'expired',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getStorageKey(scopeKey: string) {
  return `${LEGACY_STORAGE_KEY}:${scopeKey}`;
}

export function buildNotificationsScope(serverUrl: string, publicKey: string) {
  return `${encodeURIComponent(serverUrl)}::${publicKey}`;
}

function sanitizePayload(value: unknown): NotificationPayload | null {
  if (!isPlainObject(value)) return null;

  const payload: NotificationPayload = {};
  for (const [key, entry] of Object.entries(value)) {
    const isPrimitive = typeof entry === 'string'
      || typeof entry === 'boolean'
      || (typeof entry === 'number' && Number.isFinite(entry))
      || entry === null;
    if (!isPrimitive) return null;
    payload[key] = entry as NotificationPayload[string];
  }
  return payload;
}

function sanitizeNotification(value: unknown): AppNotification | null {
  if (!isPlainObject(value)) return null;

  const { id, type, createdAt, read, status, payload } = value;
  if (typeof id !== 'string' || id.trim() === '') return null;
  if (typeof type !== 'string' || !NOTIFICATION_TYPES.has(type as NotificationType)) return null;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt) || createdAt <= 0) return null;
  if (typeof read !== 'boolean') return null;
  if (status !== undefined
    && (typeof status !== 'string' || !NOTIFICATION_STATUSES.has(status as NotificationStatus))) {
    return null;
  }

  const sanitizedPayload = sanitizePayload(payload);
  if (!sanitizedPayload) return null;

  return {
    id,
    type: type as NotificationType,
    createdAt,
    read,
    status: (status ?? 'active') as NotificationStatus,
    payload: sanitizedPayload,
  };
}

function sanitizeItems(value: unknown): AppNotification[] {
  if (!Array.isArray(value)) return [];

  const sorted = value
    .map(sanitizeNotification)
    .filter((notification): notification is AppNotification => notification !== null)
    .sort((a, b) => b.createdAt - a.createdAt);

  const seen = new Set<string>();
  return sorted.filter((notification) => {
    if (seen.has(notification.id)) return false;
    seen.add(notification.id);
    return true;
  }).slice(0, MAX_NOTIFICATIONS);
}

function loadFromStorage(scopeKey: string | null): AppNotification[] {
  if (!scopeKey) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(scopeKey));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isPlainObject(parsed) ? sanitizeItems(parsed.items) : [];
  } catch {
    return [];
  }
}

function saveToStorage(scopeKey: string | null, items: AppNotification[]) {
  if (!scopeKey) return;
  try {
    localStorage.setItem(getStorageKey(scopeKey), JSON.stringify({ items }));
  } catch {
    // localStorage full or unavailable -- keep the in-memory state usable.
  }
}

const initialState: NotificationsState = {
  items: [],
  storageScope: null,
};

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    hydrateNotifications(state, action: PayloadAction<{ scopeKey: string | null }>) {
      state.storageScope = action.payload.scopeKey;
      state.items = loadFromStorage(action.payload.scopeKey);
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // localStorage unavailable -- hydration still succeeds in memory.
      }
    },
    upsertNotification(
      state,
      action: PayloadAction<{
        scopeKey: string;
        notification: Omit<AppNotification, 'read'>;
      }>,
    ) {
      if (state.storageScope !== action.payload.scopeKey) return;

      const incoming = action.payload.notification;
      const existing = state.items.find((item) => item.id === incoming.id);
      if (existing) {
        existing.type = incoming.type;
        existing.status = incoming.status;
        existing.payload = incoming.payload;
      } else {
        state.items.push({ ...incoming, read: false });
      }
      state.items.sort((a, b) => b.createdAt - a.createdAt);
      if (state.items.length > MAX_NOTIFICATIONS) state.items.length = MAX_NOTIFICATIONS;

      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
    setNotificationStatus(
      state,
      action: PayloadAction<{
        scopeKey: string;
        id: string;
        status: NotificationStatus;
        payload?: NotificationPayload;
      }>,
    ) {
      if (state.storageScope !== action.payload.scopeKey) return;
      const notification = state.items.find((item) => item.id === action.payload.id);
      if (!notification) return;
      notification.status = action.payload.status;
      if (action.payload.payload) notification.payload = action.payload.payload;
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
    markRead(state, action: PayloadAction<string>) {
      if (!state.storageScope) return;
      const notification = state.items.find((item) => item.id === action.payload);
      if (!notification || notification.read) return;
      notification.read = true;
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
    markUnread(state, action: PayloadAction<string>) {
      if (!state.storageScope) return;
      const notification = state.items.find((item) => item.id === action.payload);
      if (!notification || !notification.read) return;
      notification.read = false;
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
    markAllRead(state) {
      if (!state.storageScope || !state.items.some((notification) => !notification.read)) return;
      state.items.forEach((notification) => { notification.read = true; });
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
    clear(state) {
      if (!state.storageScope || state.items.length === 0) return;
      state.items = [];
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.items);
    },
  },
});

export const {
  hydrateNotifications,
  upsertNotification,
  setNotificationStatus,
  markRead,
  markUnread,
  markAllRead,
  clear,
} = slice.actions;

export default slice.reducer;
