// An initiative (an issue): GlokiEngageInitiative.sol, deployed by its
// creator on their own node and made public. The community keeps only a
// reference to it ({address, agent, contract}). Members read the creator's
// public copy, and become guests on their first write.
//
// The flows call it by the names, values and result shapes they always used
// (contractRead / contractWrite); the adapter below maps them onto the
// Solidity functions, which live in three contracts of one world: the root,
// Solutions and Decision.
import { addInitiative } from './glokiEngageCommunity';
import { registerHostedContract } from '../contractHosts';
import { isDemoContract } from '../demo/demoRegistry';
import { currentAgent, deploy, read, write, type ContractHost, type ContractSource } from '../ibc';
import type { IMethod } from '../interfaces';
import initiativeSol from '../../assets/contracts/sol/GlokiEngageInitiative.sol?raw';

const INITIATIVE: ContractSource = {
  source: { 'GlokiEngageInitiative.sol': initiativeSol },
  contractName: 'GlokiEngageInitiative',
};

export interface InitiativeDetails {
  description: string;
  explanation: string;
  links: string[];
  countries: string[];
}

type Part = 'root' | 'solutions' | 'decision';

const SOLUTIONS = new Set([
  'add_proposal', 'approve', 'withdraw_approval', 'get_proposals', 'get_approvals', 'request_expert_review',
  'add_expert_review', 'suggest_proposal_merge', 'decide_merge_suggestion', 'add_impact_assessment',
  'get_impact_assessments',
]);
const DECISION = new Set([
  'get_config', 'allocate', 'get_allocations', 'get_my_allocation', 'stake', 'update_stake', 'withdraw_stake',
  'get_my_stake', 'get_stakes',
]);

const partOf = (method: string): Part => (SOLUTIONS.has(method) ? 'solutions' : DECISION.has(method) ? 'decision' : 'root');

type Row = Record<string, unknown>;

const ms = (seconds: unknown): number => Number(seconds ?? 0) * 1000;
const idOf = (value: unknown): number => (value === '' || value === null || value === undefined ? 0 : Number(value));
const rows = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

function json(text: unknown): unknown {
  if (typeof text !== 'string' || !text) return [];
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

function proposalView(p: Row): Row {
  return {
    ...p,
    id: String(p.id),
    timestamp: ms(p.timestamp),
    sources: json(p.sources),
    expertReviews: rows(p.expertReviews).map((r) => ({ ...r, sources: json(r.sources), timestamp: ms(r.timestamp) })),
    mergeSuggestions: rows(p.mergeSuggestions).map((s) => ({
      target: String(s.target),
      suggester: s.suggester,
      timestamp: ms(s.timestamp),
      ...(s.decision ? { decision: s.decision } : {}),
    })),
    mergedInto: Number(p.mergedInto) ? String(p.mergedInto) : null,
  };
}

function stakeView(s: Row): Row {
  return { ...s, timestamp: ms(s.timestamp), weight: Number(s.weight) / 1000 };
}

/** The flows' values for a method, as its Solidity function takes them. */
function toValues(method: string, v: Row, commentExtras: () => Row): Row {
  switch (method) {
    case 'set_stage':
      return { next: v.stage };
    case 'add_comment':
      return {
        text: v.text,
        parent_id: idOf(v.parent_id),
        category: v.category ?? '',
        sources: JSON.stringify(v.sources ?? []),
        ...commentExtras(),
      };
    case 'delete_comment':
    case 'like_comment':
      return { comment_id: idOf(v.comment_id) };
    case 'vote_comment':
      return { comment_id: idOf(v.comment_id), direction: v.direction };
    case 'add_proposal':
      return {
        text: v.text,
        co_authors: v.co_authors ?? [],
        commitments: v.commitments ?? [],
        sources: JSON.stringify(v.sources ?? []),
        metrics: v.metrics ?? [],
        cause_id: String(v.cause_id ?? ''),
      };
    case 'approve':
    case 'withdraw_approval':
    case 'request_expert_review':
      return { proposal_id: idOf(v.proposal_id) };
    case 'add_expert_review':
      return {
        proposal_id: idOf(v.proposal_id),
        metrics: v.metrics ?? [],
        note: v.note ?? '',
        assessment: v.assessment ?? '',
        sources: JSON.stringify(v.sources ?? []),
        credentials: v.credentials ?? '',
      };
    case 'suggest_proposal_merge':
      return { source_id: idOf(v.source_id), target_id: idOf(v.target_id) };
    case 'decide_merge_suggestion':
      return { source_id: idOf(v.source_id), target_id: idOf(v.target_id), decision: v.decision };
    case 'add_impact_assessment':
      return { ...v, proposal_id: idOf(v.proposal_id) };
    case 'allocate': {
      const entries = Object.entries((v.allocations ?? {}) as Record<string, number>);
      return { proposal_ids: entries.map(([id]) => idOf(id)), credits: entries.map(([, credits]) => credits) };
    }
    default:
      return v;
  }
}

function initiativeAdapter(contractId: string, host: ContractHost, source: ContractSource, commentExtras: () => Row) {
  let parts: Promise<Record<Part, string | undefined>> | null = null;
  const at = async (part: Part): Promise<string | undefined> => {
    if (part === 'root') return undefined;
    parts ??= (read(contractId, 'get_parts', {}, { host }) as Promise<string[]>)
      .then(([solutions, decision]) => ({ root: undefined, solutions, decision }))
      .catch((err) => {
        parts = null;
        throw err;
      });
    return (await parts)[part];
  };
  const call = async (method: string, values: Row = {}): Promise<unknown> =>
    read(contractId, method, values, { host, at: await at(partOf(method)) });
  const me = () => currentAgent() ?? '';

  async function approvals(): Promise<Row[]> {
    return rows(await call('get_approvals'));
  }
  async function stakes(): Promise<Row[]> {
    return rows(await call('get_stakes')).map(stakeView);
  }

  const readers: Record<string, () => Promise<unknown>> = {
    get_details: async () => {
      const d = (await call('get_details')) as Row;
      return { ...d, createdAt: ms(d.createdAt) };
    },
    get_roles: async () => {
      const r = (await call('get_roles')) as Row;
      const endorsements: Record<string, string[]> = {};
      const endorsementCounts: Record<string, number> = {};
      for (const e of rows(r.endorsements)) {
        const keys = (e.keys as string[]) ?? [];
        endorsements[String(e.voter)] = keys;
        for (const key of keys) endorsementCounts[key] = (endorsementCounts[key] ?? 0) + 1;
      }
      return { ...r, endorsements, endorsementCounts, mergedInto: r.mergedInto || null };
    },
    get_votes: async () => Object.fromEntries(rows(await call('get_votes')).map((v) => [v.agent, v.vote])),
    get_my_vote: async () => (await call('get_my_vote', { agent: me() })) || null,
    get_tally: async () => {
      const [up, down, total] = (await call('get_tally')) as number[];
      return { up, down, total };
    },
    get_comments: async () =>
      Object.fromEntries(rows(await call('get_comments')).map((c) => [String(c.id), {
        ...c,
        id: String(c.id),
        parentId: Number(c.parentId) ? String(c.parentId) : '',
        timestamp: ms(c.timestamp),
        sources: json(c.sources),
      }])),
    get_comment_votes: async () =>
      Object.fromEntries(rows(await call('get_comment_votes')).map((v) => [`${v.voter}:${v.commentId}`, { ...v, commentId: String(v.commentId) }])),
    get_properties: async () => Object.fromEntries(rows(await call('get_properties')).map((p) => [p.key, p.value])),
    get_proposals: async () => Object.fromEntries(rows(await call('get_proposals')).map((p) => [String(p.id), proposalView(p)])),
    get_approvals: async () => {
      const out: Record<string, Record<string, boolean>> = {};
      for (const a of await approvals()) (out[String(a.voter)] ??= {})[String(a.proposalId)] = true;
      return out;
    },
    get_approval_counts: async () => {
      const out: Record<string, number> = {};
      for (const a of await approvals()) out[String(a.proposalId)] = (out[String(a.proposalId)] ?? 0) + 1;
      return out;
    },
    get_my_approvals: async () =>
      Object.fromEntries((await approvals()).filter((a) => a.voter === me()).map((a) => [String(a.proposalId), true])),
    get_impact_assessments: async () =>
      Object.fromEntries(rows(await call('get_impact_assessments')).map((a) => [`${a.proposalId}:${a.author}`, {
        ...a,
        proposalId: String(a.proposalId),
        timestamp: ms(a.timestamp),
      }])),
    get_config: async () => {
      const [credits, status] = (await call('get_config')) as [number, string];
      return { credits_per_voter: credits, status };
    },
    get_allocations: async () => {
      const out: Record<string, Record<string, number>> = {};
      for (const b of rows(await call('get_allocations'))) out[String(b.voter)] = ballot(b);
      return out;
    },
    get_my_allocation: async () => ballot((await call('get_my_allocation', { agent: me() })) as Row),
    get_results: async () => {
      const totals: Record<string, number> = {};
      for (const b of rows(await call('get_allocations'))) {
        for (const [id, credits] of Object.entries(ballot(b))) totals[id] = (totals[id] ?? 0) + Math.sqrt(credits);
      }
      return totals;
    },
    get_my_stake: async () => {
      const [found, s] = (await call('get_my_stake', { agent: me() })) as [boolean, Row];
      return found ? stakeView(s) : null;
    },
    get_stakes: async () => Object.fromEntries((await stakes()).map((s) => [s.voter, s])),
    get_total_conviction: async () => {
      const list = await stakes();
      return { total: list.reduce((sum, s) => sum + Number(s.weight), 0), count: list.length, model: 'time_accrual_v1' };
    },
    get_conviction_by_country: async () => {
      const out: Record<string, number> = {};
      for (const s of await stakes()) {
        const country = String(s.country || 'OTHER');
        out[country] = (out[country] ?? 0) + Number(s.weight);
      }
      return out;
    },
  };

  return {
    async read(method: IMethod): Promise<unknown> {
      const reader = readers[method.name];
      return reader ? reader() : call(method.name, method.values ?? {});
    },
    async write(method: IMethod): Promise<unknown> {
      const result = await write(contractId, method.name, toValues(method.name, method.values ?? {}, commentExtras), {
        at: await at(partOf(method.name)),
        guest: { host, ...source },
      });
      // New comments and proposals are known to the flows by string ids.
      return method.name === 'add_comment' || method.name === 'add_proposal' ? String(result) : result;
    },
  };
}

function ballot(b: Row | undefined): Record<string, number> {
  const ids = (b?.proposalIds as number[]) ?? [];
  const credits = (b?.credits as number[]) ?? [];
  return Object.fromEntries(ids.map((id, i) => [String(id), Number(credits[i])]));
}

/** Records where an initiative lives, so the flows' calls reach it. */
export function registerInitiativeHost(contractId: string, address: string, agent: string): void {
  if (isDemoContract(contractId) || !/^https?:\/\//.test(address) || !agent) return;
  registerHostedContract(contractId, initiativeAdapter(contractId, { server: address, agent }, INITIATIVE, () => ({})));
}

/**
 * Records where another contract with an initiative's discussion functions
 * lives (the forum), so the discussion flows' calls reach it.
 * `commentExtras` are further values its add_comment takes.
 */
export function registerDiscussionHost(
  contractId: string,
  host: ContractHost,
  source: ContractSource,
  commentExtras: () => Record<string, unknown>,
): void {
  registerHostedContract(contractId, initiativeAdapter(contractId, host, source, commentExtras));
}

/**
 * Deploys a fresh initiative on the creator's own node (they approve it there,
 * and it is proposed public), then records a reference to it on the
 * community. The creator becomes its author.
 */
export async function createInitiativeOnChain({
  serverUrl,
  publicKey,
  communityId,
  details,
}: {
  serverUrl: string;
  publicKey: string;
  communityId: string;
  details: InitiativeDetails;
}): Promise<string> {
  const contractId = await deploy({
    ...INITIATIVE,
    name: details.description,
    args: { ...details },
    isPublic: true,
  });
  registerInitiativeHost(contractId, serverUrl, publicKey);
  await addInitiative(communityId, serverUrl, contractId);
  return contractId;
}
