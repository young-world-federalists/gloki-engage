// Mock concerns_contract.py — concerns + resolutions.
import type { IMethod } from '../../interfaces';
import { readState, updateState } from '../demoState';

interface Concern {
  id: string;
  author: string;
  text: string;
  severity: string;
  resolved: boolean;
  timestamp: number;
}

interface Resolution {
  id: string;
  concernId: string;
  author: string;
  text: string;
  timestamp: number;
}

interface ConcernsState {
  concerns: Concern[];
  resolutions: Resolution[];
}

function defaultState(): ConcernsState {
  return { concerns: [], resolutions: [] };
}

function load(contractId: string): ConcernsState {
  return { ...defaultState(), ...readState<Partial<ConcernsState>>(contractId) };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

export function concernsRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_concerns':
      return s.concerns;
    case 'get_resolutions': {
      const cid = method.values?.concern_id as string | undefined;
      return cid ? s.resolutions.filter((r) => r.concernId === cid) : s.resolutions;
    }
    default:
      return null;
  }
}

export function concernsWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'add_concern': {
      const text = method.values?.text as string | undefined;
      const severity = (method.values?.severity as string) ?? 'medium';
      if (!text) return null;
      const concern: Concern = {
        id: newId(),
        author: caller,
        text,
        severity,
        resolved: false,
        timestamp: Date.now(),
      };
      updateState<ConcernsState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        concerns: [...(s.concerns ?? []), concern],
      }));
      return concern;
    }
    case 'add_resolution': {
      const concernId = method.values?.concern_id as string | undefined;
      const text = method.values?.text as string | undefined;
      if (!concernId || !text) return null;
      const resolution: Resolution = {
        id: newId(),
        concernId,
        author: caller,
        text,
        timestamp: Date.now(),
      };
      updateState<ConcernsState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        resolutions: [...(s.resolutions ?? []), resolution],
      }));
      return resolution;
    }
    case 'resolve_concern': {
      const concernId = method.values?.concern_id as string | undefined;
      if (!concernId) return null;
      updateState<ConcernsState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        concerns: (s.concerns ?? []).map((c) =>
          c.id === concernId ? { ...c, resolved: true } : c,
        ),
      }));
      return null;
    }
    default:
      return null;
  }
}
