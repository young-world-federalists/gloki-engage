// Mock initiative_contract.py
import type { IMethod } from '../../interfaces';
import { readState, writeState, updateState } from '../demoState';

const STAGE_ORDER = ['problem', 'discussion', 'proposals', 'vote', 'mandate'] as const;
const ALLOWED_STAGE_KEYS = [
  'problemVoteContractId',
  'discussionContractId',
  'discussionModsContractId',
  'proposalsContractId',
  'proposalsModsContractId',
  'voteContractId',
  'convictionContractId',
  'mergeContractId',
];

interface InitiativeState {
  details: Record<string, unknown>;
  stage: string;
  contributions: unknown[];
  segments: unknown[];
  edit_proposals: unknown[];
  proposal_votes: unknown[];
  members: unknown[];
  gaps: unknown[];
  steps: unknown[];
  properties: Record<string, unknown>;
}

function defaultState(): InitiativeState {
  return {
    details: {},
    stage: 'problem',
    contributions: [],
    segments: [],
    edit_proposals: [],
    proposal_votes: [],
    members: [],
    gaps: [],
    steps: [],
    properties: {},
  };
}

function load(contractId: string): InitiativeState {
  return { ...defaultState(), ...readState<Partial<InitiativeState>>(contractId) };
}

export function initInitiative(
  contractId: string,
  details: Record<string, unknown>,
  stage: string = 'problem',
): void {
  const s = defaultState();
  s.details = details;
  s.stage = stage;
  writeState(contractId, s);
}

export function initiativeRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_details':
      return s.details;
    case 'get_stage':
      return s.stage;
    case 'get_stage_contract': {
      const key = method.values?.stage_key as string | undefined;
      if (!key || !ALLOWED_STAGE_KEYS.includes(key)) return null;
      return (s.details as Record<string, unknown>)[key] ?? null;
    }
    case 'get_contributions':
      return s.contributions;
    case 'get_segments':
      return s.segments;
    case 'get_edit_proposals':
      return s.edit_proposals;
    case 'get_proposal_votes':
      return s.proposal_votes;
    case 'get_members':
      return s.members;
    case 'get_gaps':
      return s.gaps;
    case 'get_steps':
      return s.steps;
    case 'get_initiative':
      return { details: s.details, contributions: s.contributions };
    case 'get_roadmap':
      return {
        segments: s.segments,
        edit_proposals: s.edit_proposals,
        proposal_votes: s.proposal_votes,
        members: s.members,
      };
    case 'get_properties':
      return s.properties;
    default:
      return null;
  }
}

export function initiativeWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'set_details': {
      const incoming = (method.values?.details as Record<string, unknown>) ?? {};
      const current = load(contractId);
      const next = { ...incoming };
      if (current.details.author) {
        next.author = current.details.author;
      } else if (!next.author) {
        next.author = caller;
      }
      for (const k of ALLOWED_STAGE_KEYS) {
        if (k in current.details) next[k] = current.details[k];
      }
      updateState<InitiativeState>(contractId, (s) => ({ ...defaultState(), ...s, details: next }));
      return null;
    }
    case 'set_stage': {
      const stage = method.values?.stage as string | undefined;
      if (!stage) return { error: 'Invalid stage' };
      const idx = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
      if (idx === -1) return { error: 'Invalid stage' };
      let result: unknown = stage;
      updateState<InitiativeState>(contractId, (s) => {
        const cur = STAGE_ORDER.indexOf(s.stage as typeof STAGE_ORDER[number]);
        const safeCur = cur === -1 ? 0 : cur;
        if (idx !== safeCur + 1) {
          result = { error: 'Stages can only advance one step at a time' };
          return s;
        }
        return { ...s, stage };
      });
      return result;
    }
    case 'register_stage_contract': {
      const stageKey = method.values?.stage_key as string | undefined;
      const cid = method.values?.contract_id as string | undefined;
      const address = (method.values?.address as string) ?? '';
      const agent = (method.values?.agent as string) ?? caller;
      if (!stageKey || !ALLOWED_STAGE_KEYS.includes(stageKey)) {
        return { error: 'Invalid stage key' };
      }
      const payload = { contractId: cid, address, agent };
      let returned: unknown = payload;
      updateState<InitiativeState>(contractId, (s) => {
        if (stageKey in s.details) {
          returned = s.details[stageKey];
          return s;
        }
        return { ...s, details: { ...s.details, [stageKey]: payload } };
      });
      return returned;
    }
    case 'add_contribution': {
      const c = method.values?.contribution;
      updateState<InitiativeState>(contractId, (s) => ({
        ...s,
        contributions: [...s.contributions, c],
      }));
      return null;
    }
    case 'add_segment': {
      const seg = method.values?.segment;
      updateState<InitiativeState>(contractId, (s) => ({ ...s, segments: [...s.segments, seg] }));
      return null;
    }
    case 'set_segments': {
      const segments = (method.values?.segments as unknown[]) ?? [];
      updateState<InitiativeState>(contractId, (s) => ({ ...s, segments }));
      return null;
    }
    case 'add_edit_proposal': {
      const p = method.values?.proposal;
      updateState<InitiativeState>(contractId, (s) => ({
        ...s,
        edit_proposals: [...s.edit_proposals, p],
      }));
      return null;
    }
    case 'set_edit_proposals': {
      const list = (method.values?.proposals as unknown[]) ?? [];
      updateState<InitiativeState>(contractId, (s) => ({ ...s, edit_proposals: list }));
      return null;
    }
    case 'add_proposal_vote': {
      const v = method.values?.vote;
      updateState<InitiativeState>(contractId, (s) => ({
        ...s,
        proposal_votes: [...s.proposal_votes, v],
      }));
      return null;
    }
    case 'set_members': {
      const members = (method.values?.members as unknown[]) ?? [];
      updateState<InitiativeState>(contractId, (s) => ({ ...s, members }));
      return null;
    }
    case 'add_gap': {
      const g = method.values?.gap;
      updateState<InitiativeState>(contractId, (s) => ({ ...s, gaps: [...s.gaps, g] }));
      return null;
    }
    case 'add_step': {
      const step = method.values?.step;
      updateState<InitiativeState>(contractId, (s) => ({ ...s, steps: [...s.steps, step] }));
      return null;
    }
    case 'set_property': {
      const key = method.values?.key as string | undefined;
      const value = method.values?.value;
      if (!key) return { error: 'Invalid property key' };
      updateState<InitiativeState>(contractId, (s) => ({
        ...s,
        properties: { ...s.properties, [key]: value },
      }));
      return null;
    }
    default:
      return null;
  }
}
