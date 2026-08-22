// Real (non-mocked) community contract for gloki-engage: deploy/write/read
// against the actual IBC node, mirroring the Digital Agent profile pattern
// in src/components/identity/agent/digitalAgentContract.ts. Distinct from
// the rich `community_contract.py` (members/accounts/funding/etc.), which
// stays on the mock layer for the demo-seeded communities and their
// initiative/collaboration features — not migrated by this module.
import { deployContractOnChain, contractWriteOnChain, contractReadOnChain } from '../api';
import { waitForChainAck } from '../eventStream';
import type { IContract } from '../interfaces';
import glokiEngageCommunityContractSrc from '../../assets/contracts/gloki_engage_community_contract.py?raw';

// The `contract` field tags every contract deployed through this module —
// this is what distinguishes "a gloki-engage app community" from any other
// app's contracts on the same IBC network, and from the demo-only
// `community_contract.py`.
export const GLOKI_ENGAGE_COMMUNITY_CONTRACT = 'gloki_engage_community_contract.py';

export interface CommunityDetails {
  name: string;
  description: string;
  createdAt?: string;
}

export function isGlokiEngageCommunityContract(contract: IContract): boolean {
  return contract.contract === GLOKI_ENGAGE_COMMUNITY_CONTRACT;
}

/** Deploys a fresh community contract (named after the community) and writes its details. */
export async function createCommunityOnChain({
  serverUrl,
  publicKey,
  name,
  description,
  profile,
}: {
  serverUrl: string;
  publicKey: string;
  name: string;
  description: string;
  profile?: string;
}): Promise<string> {
  const ackId = await deployContractOnChain({
    serverUrl,
    publicKey,
    name,
    contract: GLOKI_ENGAGE_COMMUNITY_CONTRACT,
    code: glokiEngageCommunityContractSrc,
    defaultApp: window.location.origin,
    profile: profile ?? '',
  });
  // Deploy completes asynchronously; the ack id doubles as the new
  // contract's id, but it isn't safe to write to it until the matching
  // deploy_contract event confirms it's live (docs/blockchain-api.md).
  await waitForChainAck('deploy_contract', ackId);
  const contractId = ackId;

  const writeAckId = await contractWriteOnChain({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'set_details', values: { name, description } },
  });
  await waitForChainAck('contract_write', writeAckId);

  return contractId;
}

export async function getCommunityDetails({
  serverUrl,
  publicKey,
  contractId,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
}): Promise<CommunityDetails | null> {
  const result = await contractReadOnChain({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_details', values: {} },
  });
  if (!result) return null;
  return {
    name: result.name ?? '',
    description: result.description ?? '',
    createdAt: result.createdAt,
  };
}
