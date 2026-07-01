// Seeds a demo community with 5 initiatives, one frozen at each stage, and
// populates every stage sub-contract across them so reviewers can inspect every
// flow's UI immediately.
import { mockDeployDirect } from './mockApi';
import { registerDemoContract, removeDemoSubtree, getDemoContract } from './demoRegistry';
import { initCommunity, communityWrite } from './demoContracts/community';
import { fundingWrite } from './demoContracts/funding';
import { initInitiative, initiativeWrite } from './demoContracts/initiative';
import { initProblemVote } from './demoContracts/problemVote';
import { initApproval } from './demoContracts/approval';
import { initQV } from './demoContracts/qv';
import { initConviction } from './demoContracts/conviction';
import { initModification } from './demoContracts/modification';
import { initDiscussion } from './demoContracts/discussion';
import { PERSONAS, pick } from './fixtures/identity';
import { INITIATIVES, type SeedInitiative } from './fixtures/problems';
import { PROPOSALS_BY_KEY, DISCUSSION_SEED_BY_KEY, type DiscussionSeed, PROPOSAL_COMMITMENTS_BY_KEY, PROPOSAL_EXPERT_REVIEWS_BY_KEY, PROPOSAL_AUTHOR_EXTRAS_BY_KEY, EXPERTS } from './fixtures/deliberation';
import { CONVICTION_BY_KEY } from './fixtures/mandate';
import {
  votePattern,
  approvalPattern,
  qvAllocationPattern,
  convictionPattern,
} from './fixtures/mechanisms';
import { DEMO_COMMUNITIES, DEFAULT_COMMUNITY } from './fixtures/community';
import { updateState } from './demoState';
import type { IMethod } from '../interfaces';
import type { PipelineStage, StageRule } from '../trustModel';

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

  // S12: seeded experts join as members ONLY of communities that actually host an
  // expert-reviewed initiative, so an attributed review resolves to a real name +
  // country (profileRead serves EXPERTS as profiles) WITHOUT inflating member
  // counts / country tallies / 50%-support gates on unrelated communities.
  const reviewingExperts = new Set(
    initiatives.flatMap((seed) => (PROPOSAL_EXPERT_REVIEWS_BY_KEY[seed.key] ?? []).map((r) => r.expert)),
  );
  for (const e of EXPERTS) {
    if (!reviewingExperts.has(e.key)) continue;
    if (!getDemoContract(e.key)) {
      registerDemoContract({ id: e.key, name: e.name, contract: 'gloki_contract.py', createdAt: Date.now() });
    }
    communityWrite(communityId, {
      name: 'become_member',
      values: { key: e.key, value: [] },
    } as IMethod, publicKey);
  }

  // Track the deployed id of the 'water' problem initiative so the Write-Together
  // draft seed (health community block below) can reference it as the tag problem.
  let waterInitiativeId = '';

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
    const commitmentsByIndex = PROPOSAL_COMMITMENTS_BY_KEY[seed.key] ?? {};
    const reviewSeeds = PROPOSAL_EXPERT_REVIEWS_BY_KEY[seed.key] ?? [];
    const authorExtras = PROPOSAL_AUTHOR_EXTRAS_BY_KEY[seed.key] ?? {};
    const propProposals = proposals.map((text, i) => {
      const reviews = reviewSeeds
        .filter((r) => r.proposalIndex === i)
        .map((r) => ({
          expert: r.expert, metrics: r.metrics, note: r.note,
          assessment: r.assessment, credentials: r.credentials, sources: r.sources,
          timestamp: Date.now() - (proposals.length - i) * 3_600_000,
        }));
      const extras = authorExtras[i] ?? {};
      return {
        id: 'p' + i,
        text,
        author: voters[i % voters.length].publicKey,
        timestamp: Date.now() - (proposals.length - i) * 3_600_000,
        commitments: commitmentsByIndex[i] ?? [],
        ...(extras.metrics ? { metrics: extras.metrics } : {}),
        ...(extras.sources ? { sources: extras.sources } : {}),
        ...(extras.requests ? { expertReviewRequests: extras.requests } : {}),
        ...(reviews.length > 0 ? { expertReviews: reviews } : {}),
      };
    });
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

    // Capture the 'water' initiative id for the Write-Together draft tag below.
    if (seed.key === 'water') waterInitiativeId = initiativeId;

    console.log(`[DemoSeed] ${seed.title} (stage=${seed.stage}) initiativeId=${initiativeId}`);
  });

  // 5. Seed demo funds for the flagship community (Global Health Network).
  //    Two funds: "Clean Water Fund" and "Community Garden". Each gets a funding
  //    contract, contributions from seeded members, budget items, and allocations.
  //    Fund account balances are made consistent with contributions by transfer-ing
  //    each contributor's amount from their personal account into the fund account.
  const fixture = DEMO_COMMUNITIES.find((c) =>
    getDemoContract(communityId)?.name === c.name,
  );
  if (fixture?.key === 'health') {
    // Pick 4 contributors from the seeded personas — stable, coprime stride.
    const contributors = [PERSONAS[0], PERSONAS[2], PERSONAS[4], PERSONAS[6]]; // Priya, Amina, Sofia, Yuki

    // ── Fund 1: Clean Water Fund ──────────────────────────────────────────
    const fundName1 = 'Clean Water Fund';
    const { id: fundId1 } = mockDeployDirect({
      name: fundName1,
      contract: 'funding_flow_contract.py',
      parentId: communityId,
      kind: 'stage',
    });

    fundingWrite(fundId1, {
      name: 'set_config',
      values: { config: { name: fundName1, description: 'Bring safe drinking water to underserved communities.', goal: 500 } },
    } as IMethod, publicKey);

    fundingWrite(fundId1, {
      name: 'set_community_and_fund',
      values: {
        community_server: 'demo',
        community_agent: publicKey,
        community_id: communityId,
        fund_account_name: fundName1,
      },
    } as IMethod, publicKey);

    const cwContributions = [
      { id: 'cwc-1', participantId: contributors[0].publicKey, amount: 80, timestamp: Date.now() - 7 * 86400000 },
      { id: 'cwc-2', participantId: contributors[1].publicKey, amount: 60, timestamp: Date.now() - 4 * 86400000 },
      { id: 'cwc-3', participantId: contributors[2].publicKey, amount: 50, timestamp: Date.now() - 2 * 86400000 },
    ];
    for (const c of cwContributions) {
      fundingWrite(fundId1, { name: 'add_contribution', values: { contribution: c } } as IMethod, c.participantId);
    }

    fundingWrite(fundId1, { name: 'add_item', values: { item: { id: 'cwi-1', name: 'Borehole drilling (Phase 1)', createdBy: contributors[0].publicKey } } } as IMethod, contributors[0].publicKey);
    fundingWrite(fundId1, { name: 'add_item', values: { item: { id: 'cwi-2', name: 'Water-quality testing kits', createdBy: contributors[1].publicKey } } } as IMethod, contributors[1].publicKey);
    fundingWrite(fundId1, { name: 'add_item', values: { item: { id: 'cwi-3', name: 'Community training programme', createdBy: contributors[2].publicKey } } } as IMethod, contributors[2].publicKey);

    // Two members set their budget allocations across the three items.
    fundingWrite(fundId1, { name: 'set_my_allocation', values: { allocation: { 'cwi-1': 400, 'cwi-2': 350, 'cwi-3': 250 } } } as IMethod, contributors[0].publicKey);
    fundingWrite(fundId1, { name: 'set_my_allocation', values: { allocation: { 'cwi-1': 300, 'cwi-2': 400, 'cwi-3': 300 } } } as IMethod, contributors[1].publicKey);

    // Create the fund account on the community contract, then transfer each
    // contributor's amount into it to keep fund balance ≈ sum of contributions.
    communityWrite(communityId, { name: 'create_fund_account', values: { name: fundName1, owner: contributors[0].publicKey } } as IMethod, publicKey);
    for (const c of cwContributions) {
      communityWrite(communityId, { name: 'transfer', values: { to: fundName1, value: c.amount } } as IMethod, c.participantId);
    }
    // Wire the funding contract id to the community so the funds page can resolve it.
    communityWrite(communityId, { name: 'set_property', values: { key: `fund_${fundName1}`, value: fundId1 } } as IMethod, publicKey);

    // ── Fund 2: Community Garden ──────────────────────────────────────────
    const fundName2 = 'Community Garden';
    const { id: fundId2 } = mockDeployDirect({
      name: fundName2,
      contract: 'funding_flow_contract.py',
      parentId: communityId,
      kind: 'stage',
    });

    fundingWrite(fundId2, {
      name: 'set_config',
      values: { config: { name: fundName2, description: 'Grow shared green spaces for food, connection, and mental health.', goal: 300 } },
    } as IMethod, publicKey);

    fundingWrite(fundId2, {
      name: 'set_community_and_fund',
      values: {
        community_server: 'demo',
        community_agent: publicKey,
        community_id: communityId,
        fund_account_name: fundName2,
      },
    } as IMethod, publicKey);

    const cgContributions = [
      { id: 'cgc-1', participantId: contributors[1].publicKey, amount: 40, timestamp: Date.now() - 5 * 86400000 },
      { id: 'cgc-2', participantId: contributors[3].publicKey, amount: 35, timestamp: Date.now() - 3 * 86400000 },
    ];
    for (const c of cgContributions) {
      fundingWrite(fundId2, { name: 'add_contribution', values: { contribution: c } } as IMethod, c.participantId);
    }

    fundingWrite(fundId2, { name: 'add_item', values: { item: { id: 'cgi-1', name: 'Raised beds & soil', createdBy: contributors[3].publicKey } } } as IMethod, contributors[3].publicKey);
    fundingWrite(fundId2, { name: 'add_item', values: { item: { id: 'cgi-2', name: 'Irrigation system', createdBy: contributors[1].publicKey } } } as IMethod, contributors[1].publicKey);

    fundingWrite(fundId2, { name: 'set_my_allocation', values: { allocation: { 'cgi-1': 600, 'cgi-2': 400 } } } as IMethod, contributors[3].publicKey);

    communityWrite(communityId, { name: 'create_fund_account', values: { name: fundName2, owner: contributors[3].publicKey } } as IMethod, publicKey);
    for (const c of cgContributions) {
      communityWrite(communityId, { name: 'transfer', values: { to: fundName2, value: c.amount } } as IMethod, c.participantId);
    }
    communityWrite(communityId, { name: 'set_property', values: { key: `fund_${fundName2}`, value: fundId2 } } as IMethod, publicKey);

    // ── Community-level allocations ────────────────────────────────────────
    // Two members signal how the commons should be split across the two funds.
    communityWrite(communityId, {
      name: 'set_allocation',
      values: { allocation: { [fundName1]: 500, [fundName2]: 300, centralAccount: 200 } },
    } as IMethod, contributors[0].publicKey);
    communityWrite(communityId, {
      name: 'set_allocation',
      values: { allocation: { [fundName1]: 400, [fundName2]: 400, centralAccount: 200 } },
    } as IMethod, contributors[2].publicKey);

    // Give the commons treasury a small starting balance so the "Commons Treasury"
    // row reads > 0 immediately. Done via a direct state update using the same
    // writeState mechanism the seeder uses elsewhere.
    type CommunityAccounts = { accounts: Record<string, { balanceOf: number; creationTime: number; elapsedDays: number; type?: string; owner?: string }> };
    updateState<CommunityAccounts>(communityId, (s) => {
      const next = { ...s };
      if (next.accounts?.['centralAccount']) {
        next.accounts = { ...next.accounts, centralAccount: { ...next.accounts['centralAccount'], balanceOf: 300 } };
      }
      return next;
    });

    console.log(`[DemoSeed] Funds seeded: ${fundName1} (${fundId1}), ${fundName2} (${fundId2})`);

    // ── Write-Together sample draft ────────────────────────────────────────
    // Seeds one in-progress "solution" draft so the Write-Together page opens
    // alive (not empty) on first load. Linked to the 'water' problem initiative
    // that was just seeded above (id captured into waterInitiativeId).
    // Author: Priya (PERSONAS[0]); co-author: Amina (PERSONAS[2]).
    if (waterInitiativeId) {
      const wtAuthor = PERSONAS[0];   // Priya Nair — IN
      const wtCoauth = PERSONAS[2];   // Amina Suleiman — NG
      const wtEditor = PERSONAS[4];   // Sofia Rossi — IT

      const { id: wtId } = mockDeployDirect({
        name: 'wt_draft_seed',
        contract: 'discussion_contract.py',
        parentId: communityId,
        kind: 'stage',
      });

      const wtSeed: DiscussionSeed = {
        statement: {
          title: 'Community-Led Water Safety Committees',
          body: 'Establish locally-elected water safety committees in every underserved district. Each committee monitors water quality, coordinates with regional authorities, and reports publicly so problems cannot be ignored.',
          coAuthors: [wtAuthor.publicKey, wtCoauth.publicKey],
        },
        edits: [
          {
            id: 'wt-e1',
            field: 'body',
            author: wtEditor.publicKey,
            baseText: 'Establish locally-elected water safety committees in every underserved district. Each committee monitors water quality, coordinates with regional authorities, and reports publicly so problems cannot be ignored.',
            text: 'Establish locally-elected water safety committees in every underserved district. Each committee monitors water quality, coordinates with regional authorities, and publishes monthly open-data reports so communities can hold both the committee and authorities to account.',
            rationale: 'Monthly open-data reports turn accountability into something anyone can check — not just attend a meeting to hear about.',
            supporters: [wtEditor.publicKey, wtCoauth.publicKey],
            status: 'open',
            createdAgo: 45,
          },
        ],
        comments: [
          {
            id: 'wt-c1',
            author: wtCoauth.publicKey,
            text: 'In my district people already organise informally around water access. Giving that structure and authority could be transformative.',
            parentId: null,
            likes: [wtAuthor.publicKey, wtEditor.publicKey],
            minutesAgo: 90,
          },
          {
            id: 'wt-c2',
            author: wtEditor.publicKey,
            text: 'Worth specifying how the committees are funded — without a budget they become unpaid volunteers who burn out quickly.',
            parentId: null,
            likes: [wtCoauth.publicKey],
            minutesAgo: 60,
          },
          {
            id: 'wt-c2a',
            author: wtAuthor.publicKey,
            text: 'Good point. We could tie the committee budget to a small levy on regional infrastructure spend — keeps it proportional.',
            parentId: 'wt-c2',
            likes: [wtEditor.publicKey, wtCoauth.publicKey],
            minutesAgo: 30,
          },
        ],
      };

      initDiscussion(wtId, wtSeed);

      const draftEntry = {
        id: wtId,
        contractId: wtId,
        mode: 'solution' as const,
        target: communityId,
        targetName: 'Global Health Network',
        tag: {
          problemId: waterInitiativeId,
          title: 'Universal Access to Clean Drinking Water',
          community: communityId,
        },
        title: 'Community-Led Water Safety Committees',
        status: 'draft' as const,
        author: wtAuthor.publicKey,
        createdAt: Date.now() - 2 * 3_600_000, // 2 hours ago
      };

      communityWrite(communityId, {
        name: 'set_property',
        values: { key: `wtdraft_${wtId}`, value: JSON.stringify(draftEntry) },
      } as IMethod, publicKey);

      console.log(`[DemoSeed] Write-Together draft seeded: ${wtId} (tagged to waterInitiativeId=${waterInitiativeId})`);
    }
  }

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

    // Open configured stages to 'anyone' for pilot communities (honest "open pilot"
    // — the gate stays intact for all other communities; web-of-trust is preserved).
    if (community.openStages?.length) {
      const open: Partial<Record<PipelineStage, StageRule>> = {};
      for (const s of community.openStages) open[s] = 'anyone';
      communityWrite(id, {
        name: 'set_stage_permissions',
        values: { permissions: open },
      } as IMethod, publicKey);
      console.log(`[DemoSeed] Opened stages ${community.openStages.join(', ')} for ${community.name}`);
    }
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
