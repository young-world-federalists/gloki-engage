// Mock conviction_contract.py
import type { IMethod } from '../../interfaces';
import {
  CONVICTION_CAPS,
  CONVICTION_MODEL,
  convictionCap,
  isConvictionDuration,
  strengthForStake,
  type StoredConvictionStake,
} from '../../convictionModel';
import { readState, writeState } from '../demoState';

interface ConvictionState {
  stakes: Record<string, StoredConvictionStake>;
}

function load(contractId: string): ConvictionState {
  const s = readState<Partial<ConvictionState>>(contractId);
  return { stakes: s.stakes ?? {} };
}

export function initConviction(contractId: string, stakes: StoredConvictionStake[] = []): void {
  const map: Record<string, StoredConvictionStake> = {};
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
    case 'get_my_stake': {
      const stake = s.stakes[caller];
      return stake ? { ...stake, weight: strengthForStake(stake) } : null;
    }
    case 'get_stakes':
      return s.stakes;
    case 'get_total_conviction': {
      let total = 0;
      let count = 0;
      for (const stake of Object.values(s.stakes)) {
        total += strengthForStake(stake);
        count += 1;
      }
      return { total, count, model: CONVICTION_MODEL };
    }
    case 'get_conviction_by_country': {
      const result: Record<string, number> = {};
      for (const stake of Object.values(s.stakes)) {
        const country = stake.country || 'OTHER';
        result[country] = (result[country] ?? 0) + strengthForStake(stake);
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
      if (amount !== 1) return { error: 'Stake amount must be exactly 1' };
      if (!duration || !isConvictionDuration(duration)) return { error: 'Invalid duration' };
      const normalized = normalizeCountry(country);
      // S33: one backing per person, enforced HERE. This used to add to an
      // existing amount, which made one-person-one-commitment depend on the
      // client having successfully read `get_my_stake` first — a failed read
      // would silently double the caller's weight. Changes go through
      // `update_stake`. FOR OURI: the real contract must reject this too.
      if (s.stakes[caller]) return { error: 'Already backing — use update_stake' };
      s.stakes[caller] = {
        amount,
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
      if (!duration || !isConvictionDuration(duration)) return { error: 'Invalid duration' };
      const existing = s.stakes[caller];
      if (!existing) return { error: 'No commitment to change' };
      // Lengthening preserves the original backing date (the record stands);
      // shortening restarts the clock, so a long record can't be harvested and
      // then quietly downgraded. FOR OURI: enforce this server-side too.
      const wasMult = convictionCap(existing.duration);
      const nowMult = CONVICTION_CAPS[duration];
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
