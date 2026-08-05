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

export async function stake(
  serverUrl: string, publicKey: string, contractId: string,
  amount: number, duration: string, country: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'stake', values: { amount, duration, country } } as IMethod,
  }));
}

/**
 * S33 — change an existing commitment's duration. Never touches the amount, so a
 * re-commit cannot inflate one person's weight (which a second `stake` would).
 */
export async function updateStake(
  serverUrl: string, publicKey: string, contractId: string,
  duration: string, country: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'update_stake', values: { duration, country } } as IMethod,
  }));
}

/** S33 — drop your backing entirely. */
export async function withdrawStake(serverUrl: string, publicKey: string, contractId: string) {
  return throwIfContractError(await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'withdraw_stake', values: {} } as IMethod,
  }));
}

export async function getMyStake(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_my_stake', values: {} } as IMethod,
  });
}

export async function getStakes(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_stakes', values: {} } as IMethod,
  });
}

export async function getTotalConviction(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_total_conviction', values: {} } as IMethod,
  });
}

export async function getConvictionByCountry(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_conviction_by_country', values: {} } as IMethod,
  });
}
