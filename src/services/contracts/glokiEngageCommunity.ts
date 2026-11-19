// A gloki-engage community: GlokiEngageCommunity.sol, deployed by its founder
// and made public. Members join it (as partners) and enroll in its member
// list; the list, not the contract's partners, is the community's membership.
// It also keeps a reference to each initiative, which lives on its creator's
// node (glokiEngageInitiative.ts).
import { deploy, join, myContracts, read, write, type ContractHost, type ContractSource } from '../ibc';
import type { IContract, IPartner } from '../interfaces';
import communitySol from '../../assets/contracts/sol/GlokiEngageCommunity.sol?raw';

const COMMUNITY: ContractSource = {
  source: { 'GlokiEngageCommunity.sol': communitySol },
  contractName: 'GlokiEngageCommunity',
};

// How a node lists a contract of this source (its root contract, "path:Name").
const COMMUNITY_CONTRACT = 'GlokiEngageCommunity.sol:GlokiEngageCommunity';

export interface CommunityDetails {
  name: string;
  description: string;
  createdAt?: number;
}

export function isGlokiEngageCommunityContract(contract: Pick<IContract, 'contract'>): boolean {
  return contract.contract === COMMUNITY_CONTRACT;
}

/** Deploys a community (the founder approves on their node) with the founder as its first member. */
export async function createCommunityOnChain({
  serverUrl,
  name,
  description,
  profile,
}: {
  serverUrl: string;
  name: string;
  description: string;
  profile?: string;
}): Promise<string> {
  return deploy({
    ...COMMUNITY,
    name,
    args: { name, description, node: serverUrl, profile: profile ?? '' },
    isPublic: true,
  });
}

/** The community's details: from the user's copy, or from `host`'s public copy for a community the user hasn't joined. */
export async function getCommunityDetails({
  contractId,
  host,
}: {
  contractId: string;
  host?: ContractHost;
}): Promise<CommunityDetails | null> {
  const result = (await read(contractId, 'get_details', {}, { host })) as Record<string, unknown> | null;
  if (!result) return null;
  return {
    name: String(result.name ?? ''),
    description: String(result.description ?? ''),
    createdAt: Number(result.createdAt ?? 0) * 1000,
  };
}

/** The community's members, each with the node and profile contract that show their name. */
export async function getCommunityMembers(contractId: string): Promise<IPartner[]> {
  const members = (await read(contractId, 'get_members')) as { agent: string; node: string; profile: string }[];
  return (members ?? []).map((m) => ({ address: m.node, agent: m.agent, profile: m.profile }));
}

/** Joins a community through a member's node (unless already holding it), then enrolls in its member list. */
export async function joinCommunity({
  contractId,
  host,
  serverUrl,
  profile,
}: {
  contractId: string;
  host: ContractHost;
  serverUrl: string;
  profile: string;
}): Promise<void> {
  if (!(await myContracts()).some((c) => c.id === contractId)) await join(contractId, host, COMMUNITY);
  await write(contractId, 'enroll', { node: serverUrl, profile });
}

/** The community's references to its initiatives. */
export async function getInitiativeRefs(contractId: string): Promise<{ address: string; agent: string; contract: string }[]> {
  const refs = (await read(contractId, 'get_initiatives')) as { node: string; agent: string; contract_id: string }[];
  return (refs ?? []).map((r) => ({ address: r.node, agent: r.agent, contract: r.contract_id }));
}

/** Records an initiative the signed-in member created, on their own node. */
export async function addInitiative(communityId: string, node: string, initiativeId: string): Promise<void> {
  await write(communityId, 'add_initiative', { node, contract_id: initiativeId });
}
