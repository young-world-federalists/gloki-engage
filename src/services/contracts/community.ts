import { contractRead, contractWrite, deployContract } from '../api';
import type { IMethod } from '../interfaces';
const communityContractCode = '';const issueContractCode = '';const initiativeContractCode = '';
/**
 * Community contract interface
 * Handles all community-specific contract calls
 */

export interface IParameters {
  medians: {
    mint: number;
    burn: number;
    commons_mint: number;
  };
  parameters: {
    mint: number;
    burn: number;
    commons_mint: number;
  };
}

export async function createCommunity(
  serverUrl: string,
  publicKey: string,
  communityName: string,
  communityDescription: string,
  profile: string | null

): Promise<string | null> {
  // Deploy the community contract
  const deployResponse = await deployContract({
    serverUrl,
    publicKey,
    name: communityName,
    contract: 'community_contract.py',
    code: communityContractCode,
    profile: profile || undefined,
  });

  const contractId = (deployResponse as { id?: string })?.id ?? (deployResponse as string | undefined);

  // Set properties: name, description, createdAt
  if (contractId) {
    await contractWrite({
      serverUrl,
      publicKey,
      contractId,
      method: {
        name: 'set_property',
        values: {
          key: 'name',
          value: communityName
        },
      } as IMethod
    });
    
    await contractWrite({
      serverUrl,
      publicKey,
      contractId,
      method: {
        name: 'set_property',
        values: {
          key: 'description',
          value: communityDescription
        },
      } as IMethod,
    });
    
    await contractWrite({
      serverUrl,
      publicKey,
      contractId,
      method: {
        name: 'set_property',
        values: {
          key: 'createdAt',
          value: new Date().toISOString()
        },
      } as IMethod,
    });

    // Call request_join to join the community as the creator
    await contractWrite({
      serverUrl,
      publicKey,
      contractId,
      method: {
        name: 'request_join',
        values: {},
      } as IMethod,
    });
  }

  return contractId ?? null;
}

/**
 * Get partners from the community contract
 */
export async function getPartners(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_partners',
      values: {},
    } as IMethod,
  });
}

/**
 * Get all people from the community contract (tasks, members, nominates)
 */
export async function getAllPeople(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_all_people',
      values: {},
    } as IMethod,
  });
}

/**
 * Get community properties
 */
export async function getProperties(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_properties',
      values: {},
    } as IMethod,
  });
}

export async function createIssue(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  issue: { title: string; description: string },
) {
  // 1. Deploy the issue contract with the issue title as the name
  const fileName = 'issue_contract.py';
  const response = await deployContract({
    serverUrl,
    publicKey,
    name: issue.title,
    contract: fileName,
    code: issueContractCode,
  });
  const issueId = response.id || response;
  
  // 2. Set the issue properties (name and description)
  await contractWrite({
    serverUrl,
    publicKey,
    contractId: issueId,
    method: {
      name: 'set_name',
      values: { name: issue.title },
    } as IMethod,
  });
  
  await contractWrite({
    serverUrl,
    publicKey,
    contractId: issueId,
    method: {
      name: 'set_description',
      values: { text: issue.description },
    } as IMethod,
  });
  
  // 3. Add the issue to the community contract
  await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'add_issue',
      values: {
        issue: {
          server: serverUrl,
          agent: publicKey,
          contract: issueId,
        },
      },
    } as IMethod,
  });
}

/**
 * Get community issues
 */
export async function getIssues(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_issues',
      values: {},
    } as IMethod,
  });
}

export interface Collaboration {
  id: string;
  type: 'initiative' | 'wish' | 'agreement' | 'collab';
  title: string;
  description?: string;
  dreamNeed?: string;
  rule?: string;
  protection?: string;
  currencyGathered?: number;
  currencyGoal?: number;
  consensusStatus?: string;
  createdAt: number;
  activityCount?: number;
  hostServer?: string;
  hostAgent?: string;
  author?: string;
}

/**
 * Create an initiative (deploy contract + add to community)
 */
export async function createInitiative(
  serverUrl: string,
  publicKey: string,
  communityId: string,
  initiative: { title: string; description?: string; evidence?: string[]; countries?: string[] },
) {
  const response = await deployContract({
    serverUrl,
    publicKey,
    name: initiative.title,
    contract: 'initiative_contract.py',
    code: initiativeContractCode,
  });
  const initiativeId = (response as { id?: string }).id || (response as string);

  const details = {
    title: initiative.title,
    description: initiative.description || '',
    evidence: initiative.evidence || [],
    countries: initiative.countries || [],
    author: publicKey,
    createdAt: Date.now(),
    currencyGoal: 100,
    currencyGathered: 0,
    activityCount: 0,
  };
  await contractWrite({
    serverUrl,
    publicKey,
    contractId: initiativeId,
    method: {
      name: 'set_details',
      values: { details },
    } as IMethod,
  });

  const collaboration: Collaboration = {
    id: initiativeId,
    type: 'initiative',
    title: initiative.title,
    description: initiative.description,
    currencyGathered: 0,
    currencyGoal: 100,
    createdAt: Date.now(),
    activityCount: 0,
    hostServer: serverUrl,
    hostAgent: publicKey,
  };
  await addCollaboration(serverUrl, publicKey, communityId, collaboration);
  return initiativeId;
}

/**
 * Add a collaboration (initiative, wish, or agreement) to the community
 */
export async function addCollaboration(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  collaboration: Collaboration,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'add_collaboration',
      values: { collaboration },
    } as IMethod,
  });
}

/**
 * Get all collaborations from the community
 */
export async function getCollaborations(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_collaborations',
      values: {},
    } as IMethod,
  });
}

export async function requestJoin(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  // Call request_join on the community contract
  const response = await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'request_join',
      values: {},
    } as IMethod,
  });
  return response;
}

export async function recordActivity(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'record_activity', values: {} } as IMethod,
  });
}

export async function getActiveMembers(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  days: number,
): Promise<string[]> {
  const result = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_active_members', values: { days } } as IMethod,
  });
  // Old communities without this method return null; throw so callers
  // can distinguish "no method" from a legitimate empty list.
  if (!Array.isArray(result)) {
    throw new Error('get_active_members unavailable');
  }
  return result as string[];
}

/**
 * Approve an agent for community membership
 */
export async function approveAgent(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  agentPublicKey: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId: contractId,
    method: {
      name: 'approve',
      values: { approved: agentPublicKey },
    } as IMethod,
  });
}

/**
 * Disapprove an agent for community membership
 */
export async function disapproveAgent(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  agentPublicKey: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'disapprove',
      values: { disapproved: agentPublicKey },
    } as IMethod,
  });
}

export async function transfer(
  server: string,
  agent: string,
  contract: string,
  to: string,
  value: number
) {
  return await contractWrite({
    serverUrl: server,
    publicKey: agent,
    contractId: contract,
    method: {
      name: 'transfer',
      values: { to, value },
    } as IMethod,
  });
}

export async function getBalance(
  serverUrl: string,
  publicKey: string,
  contractId: string
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_balance',
      values: {},
    } as IMethod,
  });
}

export async function setParameters(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  mint: number,
  burn: number,
  commonsMint: number
) {
  return await contractWrite({
    serverUrl: serverUrl,
    publicKey: publicKey,
    contractId: contractId,
    method: {
      name: 'transfer',
      values: { to: publicKey, value: 0 },
      parameters: { mint, burn, commons_mint: commonsMint },
    } as IMethod,
  });
}

export async function getParameters(
  serverUrl: string,
  publicKey: string,
  contractId: string
) {
  const parameters: IParameters = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: "get_parameters",
      values: {},
    } as IMethod,
  });

  if (!parameters.parameters || Object.keys(parameters.parameters).length === 0) {
    console.log('No parameters found, setting default values');
    setParameters(serverUrl, publicKey, contractId, 100, 0.0003, 0);
  }

  return parameters;
}

// ---------------------------------------------------------------------------
// Funding / commons service wrappers
// ---------------------------------------------------------------------------

export interface IDistributionStatus {
  days_since_creation: number;
  payment_count: number;
  can_distribute: boolean;
}

export async function getAccountDetails(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Record<string, { type: string; balance: number }>> {
  const res = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_account_details', values: {} } as IMethod,
  });
  return (res && typeof res === 'object') ? res as Record<string, { type: string; balance: number }> : {};
}

export async function getAllAllocations(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Record<string, Record<string, number>>> {
  const res = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_allocations', values: {} } as IMethod,
  });
  return (res && typeof res === 'object') ? res as Record<string, Record<string, number>> : {};
}

export async function setAllocation(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  allocation: Record<string, number>,
): Promise<void> {
  await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'set_allocation', values: { allocation } } as IMethod,
  });
}

export async function getDistributionStatus(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<IDistributionStatus> {
  const res = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_distribution_status', values: {} } as IMethod,
  });
  const r = (res ?? {}) as Partial<IDistributionStatus>;
  return {
    days_since_creation: r.days_since_creation ?? 0,
    payment_count: r.payment_count ?? 0,
    can_distribute: r.can_distribute ?? false,
  };
}

export async function distributeCommons(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<void> {
  await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'distribute', values: {} } as IMethod,
  });
}
