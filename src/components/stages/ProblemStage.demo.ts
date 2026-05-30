// Lane B — ProblemStage runtime helpers (owned: `ProblemStage.*`).
//
// Kept separate from the fixture file (problems.ts) on purpose: this module
// imports the demo mock layer (mockApi/demoContracts), and problems.ts is
// imported BY the seeder — colocating the deploy helper there would create an
// import cycle. ProblemStage.tsx is the only importer of this file.
//
// UI-only mockup: a "proposed" candidate issue is a real demo initiative frozen
// at the `problem` stage, written through the existing mock layer (no backend).

import type { IMethod } from '../../services/interfaces';
import { mockDeployDirect } from '../../services/demo/mockApi';
import { initInitiative, initiativeWrite } from '../../services/demo/demoContracts/initiative';
import { initProblemVote } from '../../services/demo/demoContracts/problemVote';
import { communityWrite } from '../../services/demo/demoContracts/community';
import {
  INITIATIVES,
  toProblemFraming,
  type ProblemFraming,
  type SdgTag,
} from '../../services/demo/fixtures/problems';

// Session-scoped framing for issues proposed during this session. The deployed
// initiative persists (localStorage), but these display extras live in memory —
// after a reload a proposed issue degrades to a basic candidate card, which is
// fine for a mockup.
const proposedFraming = new Map<string, ProblemFraming>();

/**
 * Resolve the framing record for a candidate issue. Checks session-proposed
 * issues first (by initiative id), then the static slate (by title). Returns
 * `undefined` when nothing matches, so callers can degrade gracefully.
 */
export function getProblemFraming(initiativeId: string, title?: string): ProblemFraming | undefined {
  const proposed = proposedFraming.get(initiativeId);
  if (proposed) return proposed;
  if (title) {
    const match = INITIATIVES.find((i) => i.title === title);
    if (match) return toProblemFraming(match);
  }
  return undefined;
}

export interface ProposeIssueInput {
  publicKey: string;
  communityId: string;
  /** Short card title. */
  title: string;
  /** The problem, in one plain-language sentence (becomes the description). */
  description: string;
  /** Countries this problem is relevant to (ISO 3166-1 alpha-2). */
  countries: string[];
  /** Source links (gently required at the form level). */
  evidence: string[];
  /** Optional "who it affects and why now". */
  whoWhy?: string;
  /** Optional light SDG tag. */
  sdg?: SdgTag;
}

/**
 * Propose a candidate issue: deploy a demo initiative at the `problem` stage,
 * seed the proposer's own "second" (one upvote) so it starts with momentum, and
 * register it on the community so it appears in the issue feed. Synchronous —
 * all mock writes hit localStorage immediately. Returns the new initiative id.
 *
 * Throws if the underlying mock writes fail; callers should surface the error.
 */
export function proposeCandidateIssue(input: ProposeIssueInput): string {
  const { publicKey, communityId, title, description, countries, evidence, whoWhy, sdg } = input;
  const now = Date.now();

  const { id: initiativeId } = mockDeployDirect({
    name: title,
    contract: 'initiative_contract.py',
    parentId: communityId,
    kind: 'init',
  });

  initInitiative(
    initiativeId,
    {
      title,
      description,
      countries,
      evidence,
      author: publicKey,
      createdAt: now,
      currencyGoal: 100,
      currencyGathered: 0,
      activityCount: 0,
    },
    'problem',
  );

  // Problem-vote sub-contract, seeded with the proposer's own second.
  const { id: pvId } = mockDeployDirect({
    name: `problem_vote__${title.slice(0, 20)}`,
    contract: 'problem_vote_contract.py',
    parentId: initiativeId,
    kind: 'stage',
  });
  initProblemVote(pvId, { [publicKey]: 'up' });
  initiativeWrite(
    initiativeId,
    {
      name: 'register_stage_contract',
      values: { stage_key: 'problemVoteContractId', contract_id: pvId, address: '', agent: publicKey },
    } as IMethod,
    publicKey,
  );

  // Register on the community so it shows up in the feed alongside the slate.
  communityWrite(
    communityId,
    {
      name: 'add_collaboration',
      values: {
        collaboration: {
          id: initiativeId,
          type: 'initiative',
          title,
          description,
          author: publicKey,
          createdAt: now,
          currencyGathered: 0,
          currencyGoal: 100,
          activityCount: 1,
        },
      },
    } as IMethod,
    publicKey,
  );

  proposedFraming.set(initiativeId, {
    title,
    description,
    countries,
    evidence,
    whoWhy,
    sdg,
    voices: [],
  });

  return initiativeId;
}
