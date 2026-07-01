// Mandate ratification seam. Stores host/expert-entered indicator
// target/baseline/cadence as a single JSON property on the initiative contract
// (mirrors the write-together `wtdraft_` property pattern, but on the
// initiative rather than the community). FOR OURI: a real ratification contract.
import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';
import type { MandateRatification } from './demo/fixtures/mandate';

export const RATIFICATION_KEY = 'mandate_ratification';

/** Read the stored ratification data for an initiative, or null if none. */
export async function getRatification(
  serverUrl: string, publicKey: string, initiativeId: string,
): Promise<MandateRatification | null> {
  try {
    const raw = await contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_properties', values: {} } as IMethod,
    });
    const props = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const stored = props[RATIFICATION_KEY];
    if (typeof stored !== 'string') return null;
    const parsed = JSON.parse(stored) as MandateRatification;
    return parsed && typeof parsed === 'object' && parsed.indicators ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist ratification data (full replace — the panel always writes the whole map). */
export async function saveRatification(
  serverUrl: string, publicKey: string, initiativeId: string, data: MandateRatification,
): Promise<void> {
  await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'set_property', values: { key: RATIFICATION_KEY, value: JSON.stringify(data) } } as IMethod,
  });
}
