// The Digital Agent's own profile contract (DigitalAgent.sol): each person
// deploys one on their own node, approving it there, and it is proposed
// public, so that others can show their name and country.
import { deploy, read, write, type ContractSource } from '../../../services/ibc';
import type { AccountKind, IContract } from '../../../services/interfaces';
import { ACCOUNT_KINDS } from '../../onboarding/accountKinds';
import digitalAgentSol from '../../../assets/contracts/sol/DigitalAgent.sol?raw';

const DIGITAL_AGENT: ContractSource = {
  source: { 'DigitalAgent.sol': digitalAgentSol },
  contractName: 'DigitalAgent',
};

// The deploy's label: how this app tells its profile from other apps' contracts of the same source.
const DIGITAL_AGENT_CONTRACT_NAME = 'unique-gloki-engage-digital-agent-contract';

export interface DigitalAgentProfileFields {
  displayName: string;
  photo: string;
  country: string;
  languages: string[];
  // Omit the key (never set it to undefined) when unknown, so it can't mask
  // the local cache's value in useDigitalAgent's merge.
  accountKind?: AccountKind;
}

export function findDigitalAgentContract(contracts: IContract[]): IContract | undefined {
  return contracts.find((c) => c.name === DIGITAL_AGENT_CONTRACT_NAME);
}

/**
 * Deploys the profile contract if this agent doesn't have one yet, or writes
 * to the existing one, so editing a profile never makes a second contract.
 * Returns the contract id either way.
 */
export async function saveDigitalAgentProfile({
  existingContractId,
  fields,
}: {
  existingContractId: string | null;
  fields: DigitalAgentProfileFields;
}): Promise<string> {
  const profile = {
    display_name: fields.displayName,
    photo: fields.photo,
    country: fields.country,
    languages: fields.languages,
  };
  if (!existingContractId) {
    return deploy({
      ...DIGITAL_AGENT,
      name: DIGITAL_AGENT_CONTRACT_NAME,
      args: { ...profile, account_kind: fields.accountKind ?? '' },
      isPublic: true,
    });
  }
  await write(existingContractId, 'set_profile', profile);
  if (fields.accountKind) await write(existingContractId, 'set_account_kind', { kind: fields.accountKind });
  return existingContractId;
}

/** A profile: the signed-in person's own copy, or another person's public copy on their node. */
export async function readDigitalAgentProfile({
  serverUrl,
  publicKey,
  contractId,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
}): Promise<DigitalAgentProfileFields | null> {
  const result = (await read(contractId, 'get_profile', {}, { host: { server: serverUrl, agent: publicKey } })) as
    | Record<string, unknown>
    | null;
  if (!result) return null;
  const kind = result.accountKind as AccountKind;
  return {
    displayName: String(result.displayName ?? ''),
    photo: String(result.photo ?? ''),
    country: String(result.country ?? ''),
    languages: Array.isArray(result.languages) ? (result.languages as string[]) : [],
    ...(ACCOUNT_KINDS.includes(kind) ? { accountKind: kind } : {}),
  };
}
