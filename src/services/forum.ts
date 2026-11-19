// Forum seam (S42). THE ONLY import the forum page uses to find its contract.
// On a real page it is the one forum the network shares (Forum.sol), deployed
// by the application account, which the application settings point to; the
// demo page keeps its seeded demo discussion. Reads and writes go through
// discussionApi.ts as they do for every other discussion; a person's first
// post joins the forum as a guest.
import type { IPartner } from './interfaces';
import { isDemoDataMode } from './dataMode';
import { read } from './ibc';
import { APPLICATION, getForumContract } from './applicationSettings';
import { registerDiscussionHost } from './contracts/glokiEngageInitiative';
import { store } from '../store';
import { betaForumParticipants, ensureBetaForum } from './demo/betaForum';
import forumSol from '../assets/contracts/sol/Forum.sol?raw';

const FORUM = { source: { 'Forum.sol': forumSol }, contractName: 'Forum' };

export interface ForumCtx {
  serverUrl: string;
  publicKey: string;
  /** The id `getForumContractId()` returned. */
  contractId: string;
}

/** The forum's contract id; throws on a real page when the network has no forum yet. */
export async function getForumContractId(): Promise<string> {
  if (isDemoDataMode()) return ensureBetaForum();
  const contractId = await getForumContract();
  if (!contractId) throw new Error('The forum has not been set up on this network yet');
  // Each post records where its author's profile is, so others can show their name.
  registerDiscussionHost(contractId, APPLICATION, FORUM, () => {
    const { serverUrl, digitalAgentContractId } = store.getState().user;
    return { node: serverUrl ?? '', profile: digitalAgentContractId ?? '' };
  });
  return contractId;
}

/**
 * S43 — the forum's authors, one row each (`{ address, agent, profile }`,
 * `IPartner`), so ForumPage can dispatch the existing `fetchMemberProfile`
 * thunk per row and ThreadedDiscussion's bylines resolve from
 * `state.communities.profiles`. An empty `profile` means "no profile to
 * fetch" and the caller skips the row.
 */
export async function getForumParticipants(ctx: ForumCtx): Promise<IPartner[]> {
  if (isDemoDataMode()) return betaForumParticipants(ctx.contractId);
  const rows = (await read(ctx.contractId, 'get_participants', {}, { host: APPLICATION })) as
    | { agent: string; node: string; profile: string }[]
    | null;
  return (rows ?? []).map((r) => ({ address: r.node, agent: r.agent, profile: r.profile }));
}
