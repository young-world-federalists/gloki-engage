// Server-side counterpart to digitalAgentStore.ts: deploys, writes, and
// reads the Digital Agent's own profile contract — for real, on the actual
// IBC node (deployContractOnChain/contractWriteOnChain/contractReadOnChain
// in src/services/api.ts), unlike deployContract/contractWrite/contractRead
// which stay mocked for every other flow in this app for now.
import { deployContractOnChain, contractWriteOnChain, contractReadOnChain } from '../../../services/api';
import { waitForChainAck } from '../../../services/eventStream';
import type { IContract } from '../../../services/interfaces';
import digitalAgentContractSrc from '../../../assets/contracts/digital_agent_contract.py?raw';

// Unique across the whole IBC network, not just this app's other contract
// kinds — this is how "does this agent already have a gloki-engage profile"
// is distinguished from any other app's contracts the agent might hold.
export const DIGITAL_AGENT_CONTRACT_NAME = 'unique-gloki-engage-digital-agent-contract';

export interface DigitalAgentProfileFields {
  displayName: string;
  photo: string;
  country: string;
  languages: string[];
}

export function findDigitalAgentContract(contracts: IContract[]): IContract | undefined {
  return contracts.find((c) => c.name === DIGITAL_AGENT_CONTRACT_NAME);
}

/** Deploys a fresh profile contract and writes the given fields to it. */
export async function deployDigitalAgentProfile({
  serverUrl,
  publicKey,
  fields,
}: {
  serverUrl: string;
  publicKey: string;
  fields: DigitalAgentProfileFields;
}): Promise<string> {
  const ackId = await deployContractOnChain({
    serverUrl,
    publicKey,
    name: DIGITAL_AGENT_CONTRACT_NAME,
    contract: 'digital_agent_contract.py',
    code: digitalAgentContractSrc,
    defaultApp: window.location.origin,
  });
  // Deploy completes asynchronously; the ack id doubles as the new
  // contract's id, but it isn't safe to read/write until the matching
  // deploy_contract event confirms it's live (docs/blockchain-api.md).
  await waitForChainAck('deploy_contract', ackId);
  const contractId = ackId;
  await writeDigitalAgentProfile({ serverUrl, publicKey, contractId, fields });
  return contractId;
}

export async function writeDigitalAgentProfile({
  serverUrl,
  publicKey,
  contractId,
  fields,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  fields: DigitalAgentProfileFields;
}): Promise<void> {
  const ackId = await contractWriteOnChain({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'set_profile',
      values: {
        display_name: fields.displayName,
        photo: fields.photo,
        country: fields.country,
        languages: fields.languages,
      },
    },
  });
  await waitForChainAck('contract_write', ackId);
}

/**
 * Deploys the profile contract if this agent doesn't have one yet, or
 * writes to the existing one if it does — so re-running onboarding, or
 * editing your profile later (Profile.tsx), never creates a duplicate
 * contract for the same agent. Returns the contract id either way.
 */
export async function saveDigitalAgentProfile({
  serverUrl,
  publicKey,
  existingContractId,
  fields,
}: {
  serverUrl: string;
  publicKey: string;
  existingContractId: string | null;
  fields: DigitalAgentProfileFields;
}): Promise<string> {
  if (existingContractId) {
    await writeDigitalAgentProfile({ serverUrl, publicKey, contractId: existingContractId, fields });
    return existingContractId;
  }
  return await deployDigitalAgentProfile({ serverUrl, publicKey, fields });
}

export async function readDigitalAgentProfile({
  serverUrl,
  publicKey,
  contractId,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
}): Promise<DigitalAgentProfileFields | null> {
  const result = await contractReadOnChain({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_profile', values: {} },
  });
  if (!result) return null;
  return {
    displayName: result.displayName ?? '',
    photo: result.photo ?? '',
    country: result.country ?? '',
    languages: result.languages ?? [],
  };
}
