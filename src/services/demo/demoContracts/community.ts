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

interface CommunityState {
  members: Record<string, unknown[]>;
  properties: Record<string, unknown>;
  collaborations: Collaboration[];
  accounts: Record<string, { balanceOf: number; creationTime: number; elapsedDays: number }>;
  stage_contracts: Record<string, { contractId: string; address: string; agent: string }>;
  stage_permissions: Record<string, StageRule>;
}

function defaultState(): CommunityState {
  return { members: {}, properties: {}, collaborations: [], accounts: {}, stage_contracts: {}, stage_permissions: {} };
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
  state.accounts[publicKey] = {
    balanceOf: 1000,
    creationTime: Date.now(),
    elapsedDays: 0,
  };
  state.accounts['centralAccount'] = {
    balanceOf: 0,
    creationTime: Date.now(),
    elapsedDays: 0,
  };
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
          };
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
        };
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
    default:
      return null;
  }
}
