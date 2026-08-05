// Mock conviction_contract.py
import type { IMethod } from '../../interfaces';
import { readState, writeState } from '../demoState';

interface Stake {
  amount: number;
  duration: string;
  timestamp: number;
  country: string;
  voter: string;
}

interface ConvictionState {
  stakes: Record<string, Stake>;
}

const DURATION_MULTIPLIERS: Record<string, number> = {
  '1w': 1, '1m': 2, '3m': 4, '6m': 7, '1y': 12,
};

function load(contractId: string): ConvictionState {
  const s = readState<Partial<ConvictionState>>(contractId);
  return { stakes: s.stakes ?? {} };
}

export function initConviction(contractId: string, stakes: Stake[] = []): void {
  const map: Record<string, Stake> = {};
  for (const s of stakes) map[s.voter] = s;
  writeState<ConvictionState>(contractId, { stakes: map });
}

function normalizeCountry(c: unknown): string {
  if (typeof c !== 'string') return 'OTHER';
  const normalized = c.trim().toUpperCase();
  if (!normalized || normalized.length > 16) return 'OTHER';
  return normalized;
}

export function convictionRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_my_stake':
      return s.stakes[caller] ?? null;
    case 'get_stakes':
      return s.stakes;
    case 'get_total_conviction': {
      let total = 0;
      let count = 0;
      for (const stake of Object.values(s.stakes)) {
        const mult = DURATION_MULTIPLIERS[stake.duration] ?? 1;
        total += stake.amount * mult;
        count += 1;
      }
      return { total, count };
    }
    case 'get_conviction_by_country': {
      const result: Record<string, number> = {};
      for (const stake of Object.values(s.stakes)) {
        const mult = DURATION_MULTIPLIERS[stake.duration] ?? 1;
        const country = stake.country || 'OTHER';
        result[country] = (result[country] ?? 0) + stake.amount * mult;
      }
      return result;
    }
    default:
      return null;
  }
}

export function convictionWrite(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'stake': {
      const amount = method.values?.amount as number | undefined;
      const duration = method.values?.duration as string | undefined;
      const country = method.values?.country;
      if (typeof amount !== 'number' || amount <= 0) return { error: 'Stake amount must be positive' };
      if (!duration || !(duration in DURATION_MULTIPLIERS)) return { error: 'Invalid duration' };
      const normalized = normalizeCountry(country);
      const existing = s.stakes[caller];
      const newAmount = existing ? existing.amount + amount : amount;
      s.stakes[caller] = {
        amount: newAmount,
        duration,
        timestamp: Date.now(),
        country: normalized,
        voter: caller,
      };
      writeState(contractId, s);
      return null;
    }
    // S33: a commitment is changeable, not frozen. Duration is the ONLY thing
    // that moves — amount stays whatever the original stake set (always 1), so
    // re-committing can never inflate one person's weight the way a second
    // `stake` call would.
    case 'update_stake': {
      const duration = method.values?.duration as string | undefined;
      const country = method.values?.country;
      if (!duration || !(duration in DURATION_MULTIPLIERS)) return { error: 'Invalid duration' };
      const existing = s.stakes[caller];
      if (!existing) return { error: 'No commitment to change' };
      // Lengthening preserves the original backing date (the record stands);
      // shortening restarts the clock, so a long record can't be harvested and
      // then quietly downgraded. FOR OURI: enforce this server-side too.
      const wasMult = DURATION_MULTIPLIERS[existing.duration] ?? 1;
      const nowMult = DURATION_MULTIPLIERS[duration];
      s.stakes[caller] = {
        ...existing,
        duration,
        country: country === undefined ? existing.country : normalizeCountry(country),
        timestamp: nowMult < wasMult ? Date.now() : existing.timestamp,
      };
      writeState(contractId, s);
      return null;
    }
    case 'withdraw_stake': {
      if (!s.stakes[caller]) return { error: 'No commitment to withdraw' };
      delete s.stakes[caller];
      writeState(contractId, s);
      return null;
    }
    default:
      return null;
  }
}
