import type { TFunction } from '../i18n';

/**
 * i18n descriptor for a relative "time ago" label — key + English default +
 * vars, so the component owns the actual `t()` call (data stays i18n-free).
 */
export interface TimeAgoDescriptor {
  key: string;
  def: string;
  vars: Record<string, number>;
}

/**
 * Descriptor for a "minutes ago" duration (the canonical `time.*` key family).
 * The single relative-time implementation — feeds, chat, and the discussion
 * surfaces all resolve through here so the freshness format stays identical
 * and the locale wave translates one key family.
 */
export function relativeTimeKey(minutesAgo: number): TimeAgoDescriptor {
  if (minutesAgo < 1) return { key: 'time.now', def: 'just now', vars: {} };
  if (minutesAgo < 60) return { key: 'time.minutes', def: '{n}m ago', vars: { n: minutesAgo } };
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return { key: 'time.hours', def: '{n}h ago', vars: { n: hours } };
  const days = Math.floor(hours / 24);
  return { key: 'time.days', def: '{n}d ago', vars: { n: days } };
}

/**
 * Descriptor for a millisecond epoch timestamp. Returns null for a falsy
 * timestamp, or — when `maxDays` is set — for anything at least that old
 * (the caller decides what to render instead, e.g. an absolute date).
 */
export function formatTimeAgoKey(
  timestamp: number,
  opts?: { maxDays?: number },
): TimeAgoDescriptor | null {
  if (!timestamp) return null;
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (opts?.maxDays !== undefined && minutes >= opts.maxDays * 24 * 60) return null;
  return relativeTimeKey(minutes);
}

/**
 * Translated "time ago" label for a millisecond epoch timestamp. Returns ''
 * for a falsy/out-of-range timestamp (caller decides whether to render).
 */
export function formatTimeAgo(
  t: TFunction,
  timestamp: number,
  opts?: { maxDays?: number },
): string {
  const k = formatTimeAgoKey(timestamp, opts);
  return k ? t(k.key, k.def, k.vars) : '';
}

export default formatTimeAgo;
