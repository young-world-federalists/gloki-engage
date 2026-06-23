// Seeds a demo community with 5 initiatives, one frozen at each stage, and
// populates every stage sub-contract across them so reviewers can inspect every
// flow's UI immediately.
import { mockDeployDirect } from './mockApi';
import { registerDemoContract, removeDemoSubtree, getDemoContract } from './demoRegistry';
import { initCommunity, communityWrite } from './demoContracts/community';
import { initInitiative, initiativeWrite } from './demoContracts/initiative';
import { initProblemVote } from './demoContracts/problemVote';
import { initApproval } from './demoContracts/approval';
import { initQV } from './demoContracts/qv';
import { initConviction } from './demoContracts/conviction';
import { initModification } from './demoContracts/modification';
import { initDiscussion } from './demoContracts/discussion';
import { PERSONAS, pick } from './fixtures/identity';
import { INITIATIVES, type SeedInitiative } from './fixtures/problems';
import { PROPOSALS_BY_KEY, DISCUSSION_SEED_BY_KEY } from './fixtures/deliberation';
import { CONVICTION_BY_KEY } from './fixtures/mandate';
import {
  votePattern,
  approvalPattern,
  qvAllocationPattern,
  convictionPattern,
} from './fixtures/mechanisms';
import { DEMO_COMMUNITIES, DEFAULT_COMMUNITY } from './fixtures/community';
import type { IMethod } from '../interfaces';

const STAGE_ORDER = ['problem', 'discussion', 'proposals', 'vote', 'mandate'] as const;
type Stage = typeof STAGE_ORDER[number];

const SEED_FLAG = 'gloki_demo_seeded_';

function isAlreadySeeded(communityId: string): boolean {
  return localStorage.getItem(SEED_FLAG + communityId) === 'true';
}

function markSeeded(communityId: string): void {
  localStorage.setItem(SEED_FLAG + communityId, 'true');
}

function unmarkSeeded(communityId: string): void {
  localStorage.removeItem(SEED_FLAG + communityId);
}

function deployStageContract(
  contractFile: string,
  parentId: string,
  initiativeTitle: string,
): string {
  const { id } = mockDeployDirect({
    name: `${contractFile.replace('_contract.py', '')}__${initiativeTitle.slice(0, 20)}`,
    contract: contractFile,
    parentId,
    kind: 'stage',
  });
  return id;
}

export function seedDemoCommunity(
  communityId: string,
  publicKey: string,
  initiatives: SeedInitiative[] = INITIATIVES,
): void {
  if (isAlreadySeeded(communityId)) {
    console.log(`[DemoSeed] Community ${communityId} already seeded, skipping`);
    return;
  }
  console.log(`[DemoSeed] Seeding demo community ${communityId}`);

  // Add fake personas as members of the community so country participation
  // calculations and member lists look populated. Each persona is also
  // registered as a profile contract (id = their public key) so the real
  // member-profile flow can resolve their names — see demoContracts/profile.ts.
  for (const p of PERSONAS) {
    if (!getDemoContract(p.publicKey)) {
      registerDemoContract({
        id: p.publicKey,
        name: `${p.firstName} ${p.lastName}`,
        contract: 'gloki_contract.py',
        createdAt: Date.now(),
      });
    }
    communityWrite(communityId, {
      name: 'become_member',
      values: { key: p.publicKey, value: [] },
    } as IMethod, publicKey);
  }

  initiatives.forEach((seed, idx) => {
    const seedInt = (idx + 1) * 7919;
    const proposals = PROPOSALS_BY_KEY[seed.key] ?? [];
    const conviction = CONVICTION_BY_KEY[seed.key] ?? { participationRate: 0.6, maxAmount: 50 };
    // Author each initiative as a diverse persona so cards show a real name
    // instead of the demo user's truncated key. Index by the initiative's stable
    // position in INITIATIVES with a step coprime to the persona count, which
    // spreads authors across distinct personas (vs. pick()'s LCG, whose low bits
    // collide badly for a small modulus).
    const globalIdx = INITIATIVES.findIndex((i) => i.key === seed.key);
    const author = PERSONAS[((globalIdx >= 0 ? globalIdx : idx) * 5) % PERSONAS.length];

    // 1. Deploy the initiative contract itself
    const { id: initiativeId } = mockDeployDirect({
      name: seed.title,
      contract: 'initiative_contract.py',
      parentId: communityId,
      kind: 'init',
    });

    initInitiative(initiativeId, {
      title: seed.title,
      description: seed.description,
      countries: seed.countries,
      evidence: seed.evidence,
      author: author.publicKey,
      createdAt: Date.now(),
      currencyGoal: 100,
      currencyGathered: 0,
      activityCount: 0,
    }, 'problem');

    // 2. Deploy + populate all stage sub-contracts.
    const voters = pick(PERSONAS, 18, seedInt);

    // Problem vote
    const pvId = deployStageContract('problem_vote_contract.py', initiativeId, seed.title);
    initProblemVote(pvId, votePattern(voters, seedInt + 1));
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'problemVoteContractId', contract_id: pvId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // Discussion modifications
    const dmId = deployStageContract('modification_contract.py', initiativeId, seed.title);
    initModification(dmId, [], publicKey);
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'discussionModsContractId', contract_id: dmId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // Co-authoring discussion — pre-seeded ONLY for showcase initiatives that
    // have a seed (today: misinfo). Registering the contract id makes
    // useFlowContract JOIN it and read the rich seed; un-seeded initiatives have
    // no stored id, so their discussion deploys fresh and opens empty.
    const discSeed = DISCUSSION_SEED_BY_KEY[seed.key];
    if (discSeed) {
      const discId = deployStageContract('discussion_contract.py', initiativeId, seed.title);
      initDiscussion(discId, discSeed);
      initiativeWrite(initiativeId, {
        name: 'register_stage_contract',
        values: { stage_key: 'discussionContractId', contract_id: discId, address: '', agent: publicKey },
      } as IMethod, publicKey);
    }

    // Proposals (approval voting)
    const propProposals = proposals.map((text, i) => ({
      id: 'p' + i,
      text,
      author: voters[i % voters.length].publicKey,
      timestamp: Date.now() - (proposals.length - i) * 3_600_000,
    }));
    const propId = deployStageContract('approval_contract.py', initiativeId, seed.title);
    initApproval(propId, propProposals, approvalPattern(voters, propProposals.map((p) => p.id), seedInt + 2));
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'proposalsContractId', contract_id: propId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // Proposals modifications
    const pmId = deployStageContract('modification_contract.py', initiativeId, seed.title);
    initModification(pmId, [], publicKey);
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'proposalsModsContractId', contract_id: pmId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // QV (vote stage)
    const qvProposals = propProposals.slice(0, 4).map((p, i) => ({ ...p, id: 'p' + i }));
    const qvId = deployStageContract('qv_contract.py', initiativeId, seed.title);
    initQV(
      qvId,
      publicKey,
      qvProposals,
      qvAllocationPattern(voters, qvProposals.map((p) => p.id), 100, seedInt + 3),
      100,
    );
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'voteContractId', contract_id: qvId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // Conviction (mandate stage)
    const convId = deployStageContract('conviction_contract.py', initiativeId, seed.title);
    initConviction(
      convId,
      convictionPattern(voters, conviction.participationRate, conviction.maxAmount, seedInt + 4),
    );
    initiativeWrite(initiativeId, {
      name: 'register_stage_contract',
      values: { stage_key: 'convictionContractId', contract_id: convId, address: '', agent: publicKey },
    } as IMethod, publicKey);

    // 3. Advance to target stage (one step at a time to satisfy the validator).
    const targetIdx = STAGE_ORDER.indexOf(seed.stage as Stage);
    for (let step = 1; step <= targetIdx; step += 1) {
      initiativeWrite(initiativeId, {
        name: 'set_stage',
        values: { stage: STAGE_ORDER[step] },
      } as IMethod, publicKey);
    }

    // 4. Register on the community as a collaboration.
    communityWrite(communityId, {
      name: 'add_collaboration',
      values: {
        collaboration: {
          id: initiativeId,
          type: 'initiative',
          title: seed.title,
          description: seed.description,
          author: author.publicKey,
          createdAt: Date.now(),
          currencyGathered: 0,
          currencyGoal: 100,
          activityCount: Object.keys(votePattern(voters, seedInt + 1)).length,
        },
      },
    } as IMethod, publicKey);

    console.log(`[DemoSeed] ${seed.title} (stage=${seed.stage}) initiativeId=${initiativeId}`);
  });

  markSeeded(communityId);
  console.log('[DemoSeed] Done');
}

// Seed every demo community (deploy + populate), each with its own initiatives.
export function seedAllDemoCommunities(publicKey: string): void {
  for (const community of DEMO_COMMUNITIES) {
    const { id } = mockDeployDirect({
      name: community.name,
      contract: 'community_contract.py',
      kind: 'comm',
      publicKey,
      properties: { name: community.name, description: community.description },
    });
    const initiatives = INITIATIVES.filter((i) => i.community === community.key);
    seedDemoCommunity(id, publicKey, initiatives);
  }
}

// Reset — wipes a demo community + all its child contracts, then re-seeds it
// with its own initiatives (matched by registered name; falls back to default).
export function resetDemoCommunity(communityId: string, publicKey: string): void {
  const statePrefix = 'gloki_demo_state_';
  const subtree = removeDemoSubtree(communityId);
  for (const id of subtree) localStorage.removeItem(statePrefix + id);

  const existing = getDemoContract(communityId);
  const fixture = DEMO_COMMUNITIES.find((c) => c.name === existing?.name) ?? DEFAULT_COMMUNITY;

  // Re-register + re-init the community so its ID remains valid in Redux.
  registerDemoContract({
    id: communityId,
    name: fixture.name,
    contract: 'community_contract.py',
    createdAt: Date.now(),
  });
  initCommunity(communityId, publicKey, {
    name: fixture.name,
    description: fixture.description,
  });
  unmarkSeeded(communityId);
  seedDemoCommunity(communityId, publicKey, INITIATIVES.filter((i) => i.community === fixture.key));
}
