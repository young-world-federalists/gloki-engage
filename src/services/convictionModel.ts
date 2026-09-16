export const CONVICTION_MODEL = 'time_accrual_v1' as const;
export const ACCRUAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const CONVICTION_CAPS = {
  '1w': 1,
  '1m': 2,
  '3m': 4,
  '6m': 7,
  '1y': 12,
} as const;

export type ConvictionDuration = keyof typeof CONVICTION_CAPS;

export const CONVICTION_MATURITY_DAYS: Record<ConvictionDuration, number> = {
  '1w': 0,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 330,
};

export interface StoredConvictionStake {
  amount: number;
  duration: string;
  timestamp: number | string;
  country: string;
  voter: string;
}

export interface ConvictionStakeRead extends StoredConvictionStake {
  weight?: number;
}

export interface ConvictionTotal {
  total: number;
  count: number;
  model?: string;
}

export function isConvictionDuration(value: string): value is ConvictionDuration {
  return Object.prototype.hasOwnProperty.call(CONVICTION_CAPS, value);
}

export function convictionCap(duration: string): number {
  return isConvictionDuration(duration) ? CONVICTION_CAPS[duration] : 1;
}

export function strengthForStake(
  stake: Pick<StoredConvictionStake, 'duration' | 'timestamp'>,
  now = Date.now(),
): number {
  const cap = convictionCap(stake.duration);
  const startedAt = Number(stake.timestamp);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return 1;
  const elapsed = Math.max(0, now - startedAt);
  return Math.min(cap, 1 + elapsed / ACCRUAL_PERIOD_MS);
}
