// Mock funding_flow_contract.py — fund config, contributions, budget items, allocations.
import type { IMethod } from '../../interfaces';
import { readState, updateState } from '../demoState';

interface Contribution { id: string; participantId: string; amount: number; timestamp: number; }
interface BudgetItem { id: string; name: string; createdBy: string; }
interface FundConfig { name: string; description: string; goal: number | null; }
interface CommunityLink { server: string; agent: string; id: string; }

interface FundingState {
  config: FundConfig | null;
  contributions: Contribution[];
  items: BudgetItem[];
  allocations: Record<string, Record<string, number>>; // participant -> { itemId: points }
  community: CommunityLink | null;
  fundAccountName: string;
}

function defaultState(): FundingState {
  return { config: null, contributions: [], items: [], allocations: {}, community: null, fundAccountName: '' };
}

function load(contractId: string): FundingState {
  return { ...defaultState(), ...readState<Partial<FundingState>>(contractId) };
}

export function fundingRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_config':
      return s.config ?? {};
    case 'get_contributions':
      return s.contributions;
    case 'get_items':
      return s.items;
    case 'get_all_allocations':
      return Object.entries(s.allocations).map(([participantId, allocation]) => ({ participantId, allocation }));
    case 'get_community':
      return s.community ?? {};
    case 'get_fund_account_name':
      return s.fundAccountName;
    default:
      return null;
  }
}

export function fundingWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'set_config': {
      const config = method.values?.config as FundConfig | undefined;
      if (!config) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, config }));
      return null;
    }
    case 'set_community_and_fund': {
      const community: CommunityLink = {
        server: (method.values?.community_server as string) ?? '',
        agent: (method.values?.community_agent as string) ?? '',
        id: (method.values?.community_id as string) ?? '',
      };
      const fundAccountName = (method.values?.fund_account_name as string) ?? '';
      updateState<FundingState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (!next.community?.id) { next.community = community; next.fundAccountName = fundAccountName; }
        return next;
      });
      return null;
    }
    case 'add_contribution': {
      const contribution = method.values?.contribution as Contribution | undefined;
      if (!contribution) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, contributions: [...(s.contributions ?? []), contribution] }));
      return contribution;
    }
    case 'add_item': {
      const item = method.values?.item as BudgetItem | undefined;
      if (!item) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, items: [...(s.items ?? []), item] }));
      return item;
    }
    case 'set_my_allocation': {
      const allocation = method.values?.allocation as Record<string, number> | undefined;
      if (!allocation) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, allocations: { ...(s.allocations ?? {}), [caller]: allocation } }));
      return null;
    }
    default:
      return null;
  }
}
