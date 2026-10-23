// Seam-facing trust helpers. Components import from here / the hook — never the
// raw vouch graph. Re-exports the pure model for convenience.
import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';
import { getAgent, saveAgent } from '../components/identity/agent/digitalAgentStore';
import {
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
  type VouchMeta,
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
 * and the verification request flow (S36). `meta` records how the vouch was
 * given; callers that don't know (QR scan) get `direct` now.
 */
export function addUserVouch(voucherPk: string, meta?: VouchMeta): void {
  const agent = getAgent();
  const current = agent?.vouchedBy ?? [];
  if (!voucherPk || current.includes(voucherPk)) return;
  const entry: VouchMeta = meta ?? { method: 'direct', at: Date.now() };
  saveAgent({
    vouchedBy: [...current, voucherPk],
    vouchMeta: { ...(agent?.vouchMeta ?? {}), [voucherPk]: entry },
  });
}
