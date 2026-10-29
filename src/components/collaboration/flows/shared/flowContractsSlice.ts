import { createSlice, current } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface FlowContractsState {
  /** instanceId -> contractId */
  contracts: Record<string, string>;
  /** instanceId -> true while deploying */
  deploying: Record<string, boolean>;
  /** active identity-specific storage scope */
  storageScope: string | null;
}

const STORAGE_KEY_PREFIX = 'flowContracts';

function getStorageKey(scopeKey: string) {
  return `${STORAGE_KEY_PREFIX}:${scopeKey}`;
}

export function buildFlowContractsScope(serverUrl: string, publicKey: string) {
  return `${encodeURIComponent(serverUrl)}::${publicKey}`;
}

function sanitizeContracts(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const sanitized: Record<string, string> = {};
  for (const [instanceId, contractId] of Object.entries(value as Record<string, unknown>)) {
    if (typeof instanceId !== 'string' || instanceId.trim() === '') continue;
    if (typeof contractId !== 'string' || contractId.trim() === '') continue;
    sanitized[instanceId] = contractId;
  }
  return sanitized;
}

function loadFromStorage(scopeKey: string | null): Record<string, string> {
  if (!scopeKey) return {};
  try {
    const raw = localStorage.getItem(getStorageKey(scopeKey));
    return raw ? sanitizeContracts(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function saveToStorage(scopeKey: string | null, contracts: Record<string, string>) {
  if (!scopeKey) return;
  try {
    localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(contracts));
  } catch {
    // localStorage full or unavailable -- silent fail
  }
}

const initialState: FlowContractsState = {
  contracts: {},
  deploying: {},
  storageScope: null,
};

const flowContractsSlice = createSlice({
  name: 'flowContracts',
  initialState,
  reducers: {
    hydrateContracts(state, action: PayloadAction<{ scopeKey: string | null }>) {
      state.storageScope = action.payload.scopeKey;
      state.contracts = loadFromStorage(action.payload.scopeKey);
      state.deploying = {};
    },
    setContract(state, action: PayloadAction<{ instanceId: string; contractId: string }>) {
      state.contracts[action.payload.instanceId] = action.payload.contractId;
      state.deploying[action.payload.instanceId] = false;
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.contracts);
    },
    setDeploying(state, action: PayloadAction<{ instanceId: string }>) {
      state.deploying[action.payload.instanceId] = true;
    },
    clearDeploying(state, action: PayloadAction<{ instanceId: string }>) {
      state.deploying[action.payload.instanceId] = false;
    },
    removeContract(state, action: PayloadAction<{ instanceId: string }>) {
      delete state.contracts[action.payload.instanceId];
      delete state.deploying[action.payload.instanceId];
      const nextState = current(state);
      saveToStorage(nextState.storageScope, nextState.contracts);
    },
  },
});

export const { hydrateContracts, setContract, setDeploying, clearDeploying, removeContract } = flowContractsSlice.actions;
export default flowContractsSlice.reducer;
