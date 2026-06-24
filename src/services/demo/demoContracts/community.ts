// Mock community_contract.py — backs a demo community's members, collaborations, properties.
import type { IMethod } from '../../interfaces';
import { readState, writeState, updateState } from '../demoState';
import { getPersona, getVouchGraph } from '../fixtures/identity';
import { DEFAULT_STAGE_PERMISSIONS, type StageRule } from '../../trustModel';

interface Collaboration {
  id: string;
  type: string;
  title?: string;
  description?: string;
  author?: string;
  createdAt?: number;
  [key: string]: unknown;
}

interface Account {
  balanceOf: number;
  creationTime: number;
  elapsedDays: number;
  type?: 'personal' | 'central' | 'fund';
  owner?: string;
}

interface MonetaryParams { mint: number; burn: number; commons_mint: number; }

interface CommunityState {
  members: Record<string, unknown[]>;
  properties: Record<string, unknown>;
  collaborations: Collaboration[];
  accounts: Record<string, Account>;
  allocations: Record<string, Record<string, number>>; // member -> { account: points }
  parameters: Record<string, MonetaryParams>;           // member -> prefs
  distribution: { paymentCount: number; dayStep: number };
  stage_contracts: Record<string, { contractId: string; address: string; agent: string }>;
  stage_permissions: Record<string, StageRule>;
}

function defaultState(): CommunityState {
  return {
    members: {}, properties: {}, collaborations: [], accounts: {},
    allocations: {}, parameters: {}, distribution: { paymentCount: 0, dayStep: 0 },
    stage_contracts: {}, stage_permissions: {},
  };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function load(contractId: string): CommunityState {
  const s = readState<Partial<CommunityState>>(contractId);
  return { ...defaultState(), ...s };
}

export function initCommunity(
  contractId: string,
  publicKey: string,
  properties: Record<string, unknown> = {},
): void {
  const state = defaultState();
  state.properties = properties;
  state.members[publicKey] = [];
  state.accounts[publicKey] = { balanceOf: 1000, creationTime: Date.now(), elapsedDays: 0, type: 'personal' };
  state.accounts['centralAccount'] = { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'central' };
  state.parameters[publicKey] = { mint: 10, burn: 1, commons_mint: 5 };
  writeState(contractId, state);
}

export function communityRead(contractId: string, method: IMethod, caller: string): unknown {
  const state = load(contractId);
  switch (method.name) {
    case 'get_collaborations':
      return state.collaborations;
    case 'get_members':
      return state.members;
    case 'is_member':
      return (method.values?.agent as string | undefined) !== undefined
        ? (method.values!.agent as string) in state.members
        : caller in state.members;
    case 'get_nominates':
      return [];
    case 'get_properties':
      return state.properties;
    case 'get_accounts':
      return Object.keys(state.accounts);
    case 'get_balance': {
      const acct = state.accounts[caller];
      return acct ? acct.balanceOf : 0;
    }
    case 'check_balance': {
      const account = method.values?.account as string | undefined;
      if (!account) return 0;
      const acct = state.accounts[account];
      return acct ? acct.balanceOf : 0;
    }
    case 'get_issues':
      return [];
    case 'get_all_people':
      return { tasks: {}, members: state.members, nominates: [] };
    case 'get_partners':
      // Expose each member as a partner. Personas carry a `profile` pointer
      // (their own key, served by the gloki_contract.py demo handler) so the
      // real fetchMemberProfile flow resolves their names; non-personas (e.g.
      // the demo user) get no profile pointer and are simply skipped.
      return Object.keys(state.members).map((agent) => ({
        address: 'demo',
        agent,
        profile: getPersona(agent) ? agent : '',
      }));
    case 'get_tasks':
      return {};
    case 'get_sub_contract': {
      const name = method.values?.name as string | undefined;
      return name ? (state.properties[`sub_${name}`] ?? null) : null;
    }
    case 'get_stage_contract': {
      const key = method.values?.stage_key as string | undefined;
      return key ? (state.stage_contracts[key] ?? null) : null;
    }
    case 'get_active_members':
      return Object.keys(state.members);
    case 'get_vouches':
      // Web-of-trust graph: member -> members who vouch for them. Computed from
      // fixtures at read time, intersected with current membership.
      return getVouchGraph(Object.keys(state.members));
    case 'get_stage_permissions':
      // Default-merged so un-configured communities return sane defaults.
      return { ...DEFAULT_STAGE_PERMISSIONS, ...state.stage_permissions };
    case 'get_fund_balance': {
      const fundName = method.values?.fund_name as string | undefined;
      if (!fundName) return 0;
      return state.accounts[fundName]?.balanceOf ?? 0;
    }
    case 'get_allocations':
      return state.allocations;
    case 'get_account_details': {
      const result: Record<string, { type: string; balance: number }> = {};
      for (const [name, acct] of Object.entries(state.accounts)) {
        result[name] = { type: acct.type ?? 'personal', balance: acct.balanceOf };
      }
      return result;
    }
    case 'get_distribution_status': {
      const hasFund = Object.values(state.accounts).some((a) => a.type === 'fund');
      return {
        days_since_creation: state.distribution.dayStep,
        payment_count: state.distribution.paymentCount,
        can_distribute: hasFund,
      };
    }
    case 'get_parameters': {
      const mints: number[] = [], burns: number[] = [], commons: number[] = [];
      for (const p of Object.values(state.parameters)) {
        mints.push(p.mint); burns.push(p.burn); commons.push(p.commons_mint);
      }
      return {
        parameters: state.parameters[caller] ?? { mint: 0, burn: 0, commons_mint: 0 },
        medians: { mint: median(mints), burn: median(burns), commons_mint: median(commons) },
      };
    }
    default:
      return null;
  }
}

export function communityWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'add_collaboration': {
      const collab = method.values?.collaboration as Collaboration | undefined;
      if (!collab) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.collaborations = [...next.collaborations, collab];
        return next;
      });
      return null;
    }
    case 'set_property': {
      const key = method.values?.key as string | undefined;
      const value = method.values?.value;
      if (!key) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.properties = { ...next.properties, [key]: value };
        return next;
      });
      return null;
    }
    case 'set_instructions': {
      const instructions = method.values?.instructions;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.properties = { ...next.properties, instructions };
        return next;
      });
      return null;
    }
    case 'set_sub_contract': {
      const name = method.values?.name as string | undefined;
      const invite = method.values?.invite;
      if (!name) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.properties = { ...next.properties, [`sub_${name}`]: invite };
        return next;
      });
      return null;
    }
    case 'request_join': {
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (!(caller in next.members)) {
          next.members[caller] = [];
          next.accounts[caller] = {
            balanceOf: 1000,
            creationTime: Date.now(),
            elapsedDays: 0,
            type: 'personal',
          };
          next.parameters[caller] = { mint: 10, burn: 1, commons_mint: 5 };
        }
        return next;
      });
      return true;
    }
    case 'become_member': {
      const key = method.values?.key as string | undefined;
      const value = method.values?.value;
      if (!key) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.members[key] = Array.isArray(value) ? (value as unknown[]) : [];
        next.accounts[key] = {
          balanceOf: 1000,
          creationTime: Date.now(),
          elapsedDays: 0,
          type: 'personal',
        };
        next.parameters[key] = { mint: 10, burn: 1, commons_mint: 5 };
        return next;
      });
      return null;
    }
    case 'approve':
    case 'disapprove':
    case 'add_issue':
      return null;
    case 'register_stage_contract': {
      const key = method.values?.stage_key as string | undefined;
      const cid = method.values?.contract_id as string | undefined;
      const address = (method.values?.address as string) ?? '';
      const agent = (method.values?.agent as string) ?? caller;
      if (!key || !cid) return { error: 'Invalid stage_key or contract_id' };
      const payload = { contractId: cid, address, agent };
      let returned: unknown = payload;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (next.stage_contracts[key]) {
          returned = next.stage_contracts[key];
          return next;
        }
        next.stage_contracts = { ...next.stage_contracts, [key]: payload };
        return next;
      });
      return returned;
    }
    case 'record_activity':
      return null;
    case 'transfer': {
      const to = method.values?.to as string | undefined;
      const value = (method.values?.value as number) ?? 0;
      if (!to) return false;
      let ok = false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        // Apply monetary-policy parameters when present (set_parameters carrier mechanism).
        const params = method.parameters as { mint?: number; burn?: number; commons_mint?: number } | undefined;
        if (params && (params.mint !== undefined || params.burn !== undefined || params.commons_mint !== undefined)) {
          next.parameters = { ...next.parameters, [caller]: { mint: params.mint ?? 0, burn: params.burn ?? 0, commons_mint: params.commons_mint ?? 0 } };
        }
        const sender = next.accounts[caller];
        const recipient = next.accounts[to];
        if (sender && recipient && sender.balanceOf >= value) {
          sender.balanceOf -= value;
          recipient.balanceOf += value;
          next.accounts = { ...next.accounts, [caller]: sender, [to]: recipient };
          ok = true;
        }
        return next;
      });
      return ok;
    }
    case 'set_stage_permissions': {
      const permissions = method.values?.permissions as Record<string, StageRule> | undefined;
      if (!permissions) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.stage_permissions = { ...next.stage_permissions, ...permissions };
        return next;
      });
      return true;
    }
    case 'create_fund_account': {
      const name = method.values?.name as string | undefined;
      const owner = (method.values?.owner as string) ?? caller;
      if (!name) return false;
      let created = false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (next.accounts[name]) return next;
        next.accounts = { ...next.accounts, [name]: { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'fund', owner } };
        created = true;
        return next;
      });
      return created;
    }
    case 'fund_transfer': {
      const fundName = method.values?.fund_name as string | undefined;
      const to = method.values?.to as string | undefined;
      const value = (method.values?.value as number) ?? 0;
      if (!fundName || !to) return false;
      let ok = false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        const fund = next.accounts[fundName];
        const recipient = next.accounts[to];
        if (fund && fund.type === 'fund' && fund.owner === caller && recipient && fund.balanceOf >= value) {
          next.accounts = { ...next.accounts, [fundName]: { ...fund, balanceOf: fund.balanceOf - value }, [to]: { ...recipient, balanceOf: recipient.balanceOf + value } };
          ok = true;
        }
        return next;
      });
      return ok;
    }
    case 'set_allocation': {
      const allocation = method.values?.allocation as Record<string, number> | undefined;
      if (!allocation) return false;
      const total = Object.values(allocation).reduce((sum, v) => sum + v, 0);
      if (total > 1000) return false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.allocations = { ...next.allocations, [caller]: allocation };
        return next;
      });
      return true;
    }
    case 'distribute': {
      let status = { days_since_creation: 0, payment_count: 0, can_distribute: false };
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        // One simulated day: mint the median commons into the treasury, then split it
        // across funds by the community's collective allocation points.
        const commonsMint = median(Object.values(next.parameters).map((p) => p.commons_mint));
        const central = { ...(next.accounts['centralAccount'] ?? { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'central' as const }) };
        central.balanceOf += commonsMint;
        const fundNames = Object.keys(next.accounts).filter((n) => next.accounts[n].type === 'fund');
        const fundPoints: Record<string, number> = {};
        let totalFundPoints = 0;
        for (const alloc of Object.values(next.allocations)) {
          for (const fn of fundNames) {
            const pts = alloc[fn] ?? 0;
            fundPoints[fn] = (fundPoints[fn] ?? 0) + pts;
            totalFundPoints += pts;
          }
        }
        const pool = central.balanceOf;
        const updated: Record<string, Account> = { ...next.accounts };
        if (totalFundPoints > 0 && pool > 0) {
          let distributed = 0;
          for (const fn of fundNames) {
            const amount = Math.floor((pool * (fundPoints[fn] ?? 0)) / totalFundPoints);
            updated[fn] = { ...updated[fn], balanceOf: updated[fn].balanceOf + amount };
            distributed += amount;
          }
          central.balanceOf = pool - distributed; // keep rounding dust in the treasury; total supply conserved
        }
        updated['centralAccount'] = central;
        next.accounts = updated;
        next.distribution = { paymentCount: next.distribution.paymentCount + 1, dayStep: next.distribution.dayStep + 1 };
        status = { days_since_creation: next.distribution.dayStep, payment_count: next.distribution.paymentCount, can_distribute: fundNames.length > 0 };
        return next;
      });
      return status;
    }
    default:
      return null;
  }
}
