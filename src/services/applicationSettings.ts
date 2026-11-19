// The application settings contract (ApplicationSettings.sol) on the central
// application account (applicationServer.ts). THE ONLY module that talks to
// it. It is public, so anyone reads it without signing in. It answers where
// the verification contract lives — its id and the agents that host it — and
// where the forum is. The verification contract itself is deployed on the
// founder's own agent (verificationRegistry.ts); the founder joins this
// contract as a guest to publish where it is. The forum is the application
// account's own.
import { publicRead, write, type ContractHost } from './ibc';
import { APPLICATION_AGENT, APPLICATION_SERVER_URL, APPLICATION_SETTINGS_CONTRACT } from './applicationServer';
import settingsSol from '../assets/contracts/sol/ApplicationSettings.sol?raw';

export const APPLICATION: ContractHost = { server: APPLICATION_SERVER_URL, agent: APPLICATION_AGENT };

const SETTINGS = {
  source: { 'ApplicationSettings.sol': settingsSol },
  contractName: 'ApplicationSettings',
};

export interface VerificationLocation {
  contract: string;
  /** Agents holding the verification contract; any of them can serve it. */
  hosts: ContractHost[];
}

/** Where the verification contract lives, or null if verification hasn't started. */
export async function getVerificationLocation(): Promise<VerificationLocation | null> {
  const [contract, hosts] = (await publicRead(APPLICATION, APPLICATION_SETTINGS_CONTRACT, 'get_verification')) as [
    string,
    { server: string; agent: string }[],
  ];
  const listed = (hosts ?? []).filter((h) => h.server && h.agent);
  if (!contract || listed.length === 0) return null;
  return { contract, hosts: listed };
}

/**
 * Records the signed-in agent, on `server`, as holding the verification
 * contract `contract`. The first registration fixes the contract id; a
 * different id afterwards is refused with 'Verification has already started'.
 */
export async function registerVerificationHost(server: string, contract: string): Promise<void> {
  await write(APPLICATION_SETTINGS_CONTRACT, 'register_verification', { server, contract_id: contract }, {
    guest: { host: APPLICATION, ...SETTINGS },
  });
}

/** The forum's contract id on the application account, or '' if there is none yet. */
export async function getForumContract(): Promise<string> {
  return String((await publicRead(APPLICATION, APPLICATION_SETTINGS_CONTRACT, 'get_forum')) ?? '');
}
