// S42 — the beta's one shared forum, as a demo discussion contract.
//
// A single fixed id registered on first use, so every session on this device
// opens the same thread. A DEMO_VERSION bump wipes it with the rest
// (mockApi.ts clearAllDemoState).
//
// S43: it opens with ONE welcome post from a named persona, so the byline path
// (name + flag through `getForumParticipants`) has something to show on a
// device with no community seeded. The persona's profile contract is
// registered here too — in the beta nothing else registers personas, and
// without it `get_profile` would answer null and the byline would fall back
// to a truncated key. Demo stub only: Ouri's layer carries no seed and the
// real forum opens empty.
//
// FOR OURI: src/services/forum.ts replaces this with the id of the one
// discussion contract the network shares — see docs/FOR_OURI_seam.md, S42/S43.
import type { IMethod, IPartner } from '../interfaces';
import { getDemoContract, registerDemoContract } from './demoRegistry';
import { discussionRead, initDiscussion } from './demoContracts/discussion';
import { getPersona } from './fixtures/identity';

const FORUM_ID = 'demo-forum-beta';
const WELCOME_AUTHOR = 'demo-user-in-priya'; // Priya Nair, IN — the default voucher persona

function registerPersonaProfile(publicKey: string): void {
  const persona = getPersona(publicKey);
  if (!persona || getDemoContract(publicKey)) return;
  registerDemoContract({
    id: publicKey,
    name: `${persona.firstName} ${persona.lastName}`,
    contract: 'gloki_contract.py',
    createdAt: Date.now(),
  });
}

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
      comments: [
        {
          id: 'forum-welcome',
          author: WELCOME_AUTHOR,
          parentId: null,
          likes: [],
          minutesAgo: 60 * 24,
          text: 'Welcome to the Gloki forum. This is one conversation shared by everyone in the test. Say hello, tell us where you are writing from, and post anything you would like the group to talk about.',
        },
      ],
    });
  }
  registerPersonaProfile(WELCOME_AUTHOR);
  return FORUM_ID;
}

/**
 * S43 — the forum's authors as `get_partners` rows, so ForumPage can run the
 * same member-profile flow a community does. A persona's `profile` points at
 * its own key (served by demoContracts/profile.ts); anyone else — the signed-in
 * user included — gets no pointer and is skipped, exactly as a community's
 * get_partners does for the demo user.
 */
export function betaForumParticipants(contractId: string): IPartner[] {
  const comments = discussionRead(contractId, { name: 'get_comments', values: {} } as IMethod, '');
  const authors = new Set<string>();
  for (const c of Array.isArray(comments) ? comments : []) {
    const row = c as { author?: unknown; deleted?: unknown };
    if (typeof row.author === 'string' && row.author && !row.deleted) authors.add(row.author);
  }
  return [...authors].map((agent) => ({
    address: 'demo',
    agent,
    profile: getPersona(agent) ? agent : '',
  }));
}
