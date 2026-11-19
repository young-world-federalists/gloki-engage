// Real contracts the generic flow calls (contractRead / contractWrite in
// api.ts) reach through an adapter: where the contract lives, and how the
// flows' method names, values and results map onto its Solidity functions.
// Registered when the app learns of the contract (an initiative from its
// community's list or its route).
import type { IMethod } from './interfaces';

export interface HostedContract {
  read(method: IMethod): Promise<unknown>;
  write(method: IMethod): Promise<unknown>;
}

const hosted = new Map<string, HostedContract>();

export function registerHostedContract(contractId: string, contract: HostedContract): void {
  if (contractId) hosted.set(contractId, contract);
}

export function hostedContract(contractId: string): HostedContract | undefined {
  return hosted.get(contractId);
}
