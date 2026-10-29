// Real (non-mocked) initiative contract for gloki-engage, mirroring
// glokiEngageCommunity.ts's pattern. An initiative may be started by ANY
// member of a community, so it's deployed on THAT member's own server —
// distinct from the community contract's server. The community only ever
// stores a *reference* to it (address/agent/contract), never the data
// itself; reading an initiative means reaching out to wherever it actually
// lives.
//
// Members never join an initiative contract (that would put every
// transaction through consensus). Everyone reads and writes it on the
// creator's node through the creator's agent — contractRead/contractWrite
// route there once the contract is registered with registerInitiativeHost —
// and every member-specific method takes the acting member's key as `agent`.
import { deployContractOnChain, contractWriteOnChain } from '../api';
import { registerHostedContract } from '../contractHosts';
import { isDemoContract } from '../demo/demoRegistry';
import { watchForChainAck } from '../eventStream';
import glokiEngageInitiativeContractSrc from '../../assets/contracts/gloki_engage_initiative_contract.py?raw';

const GLOKI_ENGAGE_INITIATIVE_CONTRACT = 'gloki_engage_initiative_contract.py';

export interface InitiativeDetails {
  description: string;
  explanation: string;
  links: string[];
  countries: string[];
}

/** Where a community-referenced initiative contract actually lives. */
export interface InitiativeRef {
  address: string; // the deploying member's serverUrl
  agent: string; // the deploying member's publicKey
  contract: string; // the initiative contract's id
}

/**
 * The contract's methods that act for, or read for, one member. contractRead/
 * contractWrite add `agent: <the signed-in key>` to exactly these calls.
 * Must match the `agent` parameters in gloki_engage_initiative_contract.py.
 */
const INITIATIVE_MEMBER_METHODS: ReadonlySet<string> = new Set([
  'set_details', 'set_stage',
  'endorse_expert', 'unendorse_expert', 'add_co_author',
  'upvote', 'downvote', 'remove_vote', 'get_my_vote',
  'add_comment', 'delete_comment', 'like_comment', 'vote_comment',
  'add_proposal', 'approve', 'withdraw_approval', 'get_my_approvals',
  'request_expert_review', 'add_expert_review', 'suggest_proposal_merge', 'add_impact_assessment',
  'allocate', 'get_my_allocation',
  'stake', 'update_stake', 'withdraw_stake', 'get_my_stake',
]);

/** Records where an initiative lives, so every call to it goes to its creator's node and agent. */
export function registerInitiativeHost(contractId: string, address: string, agent: string): void {
  if (isDemoContract(contractId) || !/^https?:\/\//.test(address)) return;
  registerHostedContract(contractId, { server: address, agent }, INITIATIVE_MEMBER_METHODS);
}

/**
 * Deploys a fresh initiative contract on the caller's own server, writes its
 * details, then records a {address, agent, contract} reference to it on the
 * community contract via add_initiative.
 */
export async function createInitiativeOnChain({
  serverUrl,
  publicKey,
  communityId,
  details,
}: {
  serverUrl: string;
  publicKey: string;
  communityId: string;
  details: InitiativeDetails;
}): Promise<string> {
  // Start listening BEFORE issuing the deploy/write calls — a write can
  // complete and emit its event within the same tick as the HTTP response,
  // so attaching the listener only after we know the ack id can miss it
  // (see watchForChainAck's docs). One 'contract_write' watcher covers both
  // writes below (set_details, then add_initiative).
  const deployWatcher = watchForChainAck('deploy_contract');
  const writeWatcher = watchForChainAck('contract_write');
  try {
    const ackId = await deployContractOnChain({
      serverUrl,
      publicKey,
      name: details.description,
      contract: GLOKI_ENGAGE_INITIATIVE_CONTRACT,
      code: glokiEngageInitiativeContractSrc,
      defaultApp: window.location.origin,
    });
    await deployWatcher.waitFor(ackId);
    const contractId = ackId;

    const writeAckId = await contractWriteOnChain({
      serverUrl,
      publicKey,
      contractId,
      method: {
        name: 'set_details',
        values: {
          agent: publicKey,
          description: details.description,
          explanation: details.explanation,
          links: details.links,
          countries: details.countries,
        },
      },
    });
    await writeWatcher.waitFor(writeAckId);
    registerInitiativeHost(contractId, serverUrl, publicKey);

    const ref: InitiativeRef = { address: serverUrl, agent: publicKey, contract: contractId };
    const addAckId = await contractWriteOnChain({
      serverUrl,
      publicKey,
      contractId: communityId,
      method: { name: 'add_initiative', values: { initiative: ref } },
    });
    await writeWatcher.waitFor(addAckId);

    return contractId;
  } finally {
    deployWatcher.dispose();
    writeWatcher.dispose();
  }
}

