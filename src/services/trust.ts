// Seam-facing trust helpers. Components import from here / the hook — never the
// raw vouch graph. Re-exports the pure model for convenience.
import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';
import { getAgent, saveAgent } from '../components/identity/agent/digitalAgentStore';
import {
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
} from './trustModel';

export * from './trustModel';

interface Ctx {
  serverUrl: string;
  publicKey: string;
  communityId: string;
}

export async function getCommunityVouches({ serverUrl, publicKey, communityId }: Ctx): Promise<Record<string, string[]>> {
  const res = await contractRead({
    serverUrl,
    publicKey,
    contractId: communityId,
    method: { name: 'get_vouches', values: {} } as IMethod,
  });
  return res && typeof res === 'object' ? (res as Record<string, string[]>) : {};
}

export async function getStagePermissions({ serverUrl, publicKey, communityId }: Ctx): Promise<Record<PipelineStage, StageRule>> {
  const res = await contractRead({
    serverUrl,
    publicKey,
    contractId: communityId,
    method: { name: 'get_stage_permissions', values: {} } as IMethod,
  });
  return { ...DEFAULT_STAGE_PERMISSIONS, ...(res && typeof res === 'object' ? (res as Record<string, StageRule>) : {}) };
}

export async function setStagePermissions(
  { serverUrl, publicKey, communityId }: Ctx,
  permissions: Record<PipelineStage, StageRule>,
): Promise<void> {
  await contractWrite({
    serverUrl,
    publicKey,
    contractId: communityId,
    method: { name: 'set_stage_permissions', values: { permissions } } as IMethod,
  });
}

/**
 * The current user's own vouches live in the Digital Agent store (localStorage,
 * reactive), extending the onboarding pattern. Dedup append. Used by the QR scan
 * and the "meet a member" demo action so a pending user can cross 2 -> 4.
 */
export function addUserVouch(voucherPk: string): void {
  const current = getAgent()?.vouchedBy ?? [];
  if (!voucherPk || current.includes(voucherPk)) return;
  saveAgent({ vouchedBy: [...current, voucherPk] });
}
