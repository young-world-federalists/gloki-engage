// Contracts that are used without joining them: every read and write goes to
// the node and agent that host the contract (its creator), never to the
// signed-in user's own node. contractRead/contractWrite (api.ts) consult this
// table; a registered contract also gets its write events followed on the
// host's node (eventStreamService.watchContract), so live updates still arrive.
//
// Because the call runs as the host's agent, the contract's master() is the
// host for everyone. Methods listed in `memberMethods` take the acting
// member's key as an explicit `agent` argument, which api.ts adds.
import { eventStreamService } from './eventStream';

export interface ContractHost {
  server: string;
  agent: string;
}

export interface HostedContract {
  host: ContractHost;
  memberMethods: ReadonlySet<string>;
}

const hosted = new Map<string, HostedContract>();

export function registerHostedContract(
  contractId: string,
  host: ContractHost,
  memberMethods: ReadonlySet<string>,
): void {
  if (!contractId || !host.server || !host.agent) return;
  hosted.set(contractId, { host, memberMethods });
  eventStreamService.watchContract(host.server, host.agent, contractId);
}

export function hostedContract(contractId: string): HostedContract | undefined {
  return hosted.get(contractId);
}
