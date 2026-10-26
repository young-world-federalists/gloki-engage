// Forum seam (S42). THE ONLY import the forum page uses to find its contract.
// Today it hands back one seeded demo discussion contract; FOR OURI swaps the
// body for the id of the discussion contract the whole network shares
// (docs/FOR_OURI_seam.md, S42 addendum). Reads and writes on that contract go
// through discussionApi.ts as they do for every other discussion.
import type { IPartner } from './interfaces';
import { betaForumParticipants, ensureBetaForum } from './demo/betaForum';

export interface ForumCtx {
  serverUrl: string;
  publicKey: string;
  /** The id `getForumContractId()` returned. */
  contractId: string;
}

export function getForumContractId(): Promise<string> {
  return Promise.resolve(ensureBetaForum());
}

/**
 * S43 — the forum's authors, one `get_partners`-shaped row each
 * (`{ address, agent, profile }`, `IPartner`), so ForumPage can dispatch the
 * existing `fetchMemberProfile` thunk per row and ThreadedDiscussion's bylines
 * resolve from `state.communities.profiles` with no community loaded. An empty
 * `profile` means "no profile to fetch" and the caller skips the row, as the
 * community member flow already does. FOR OURI: return each author's Digital
 * Agent profile contract here, as `get_partners` does for a community's members
 * (docs/FOR_OURI_seam.md, S42 addendum).
 */
export function getForumParticipants(ctx: ForumCtx): Promise<IPartner[]> {
  return Promise.resolve(betaForumParticipants(ctx.contractId));
}
