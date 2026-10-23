// S42 — the beta's one shared forum, as a demo discussion contract.
//
// A single fixed id registered on first use, so every session on this device
// opens the same thread. It opens EMPTY on purpose: a seeded conversation from
// demo personas would read as real posts in a public test, and their names
// would not resolve without a community's member list loaded. A DEMO_VERSION
// bump wipes it with the rest (mockApi.ts clearAllDemoState).
//
// FOR OURI: src/services/forum.ts replaces this with the id of the one
// discussion contract the network shares — see docs/FOR_OURI_seam.md, S42.
import { getDemoContract, registerDemoContract } from './demoRegistry';
import { initDiscussion } from './demoContracts/discussion';

const FORUM_ID = 'demo-forum-beta';

export function ensureBetaForum(): string {
  if (!getDemoContract(FORUM_ID)) {
    registerDemoContract({
      id: FORUM_ID,
      name: 'Gloki forum',
      contract: 'discussion_contract.py',
      createdAt: Date.now(),
    });
    initDiscussion(FORUM_ID, {
      statement: { title: 'Gloki forum', body: '', coAuthors: [] },
      edits: [],
      comments: [],
    });
  }
  return FORUM_ID;
}
