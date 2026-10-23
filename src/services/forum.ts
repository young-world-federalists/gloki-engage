// Forum seam (S42). THE ONLY import the forum page uses to find its contract.
// Today it hands back one seeded demo discussion contract; FOR OURI swaps the
// body for the id of the discussion contract the whole network shares
// (docs/FOR_OURI_seam.md, S42 addendum). Reads and writes on that contract go
// through discussionApi.ts as they do for every other discussion.
import { ensureBetaForum } from './demo/betaForum';

export function getForumContractId(): Promise<string> {
  return Promise.resolve(ensureBetaForum());
}
