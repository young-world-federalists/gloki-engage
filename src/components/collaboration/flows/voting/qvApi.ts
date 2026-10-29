import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

function throwIfContractError(response: unknown) {
  if (
    response &&
    typeof response === 'object' &&
    'error' in response &&
    typeof (response as { error?: unknown }).error === 'string'
  ) {
    throw new Error((response as { error: string }).error);
  }
  return response;
}

export async function getConfig(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_config', values: {} } as IMethod });
}

export async function getProposals(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_proposals', values: {} } as IMethod });
}

export async function allocate(serverUrl: string, publicKey: string, contractId: string, allocations: Record<string, number>) {
  return throwIfContractError(await contractWrite({ serverUrl, publicKey, contractId, method: { name: 'allocate', values: { allocations } } as IMethod }));
}

export async function getAllocations(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_allocations', values: {} } as IMethod });
}

export async function getMyAllocation(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_my_allocation', values: {} } as IMethod });
}

export async function getResults(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_results', values: {} } as IMethod });
}
