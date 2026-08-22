import { useSyncExternalStore } from 'react';
import { useAppSelector } from '../../../store/hooks';
import {
  subscribe,
  getAgent,
  saveAgent,
  clearAgent,
  type DigitalAgent,
} from './digitalAgentStore';

export interface UseDigitalAgent {
  agent: DigitalAgent | null;
  isOnboarded: boolean;
  hasAgent: boolean;
  saveAgent: (partial: Partial<DigitalAgent>) => void;
  clearAgent: () => void;
}

/**
 * The Digital Agent as seen by the rest of the app: profile fields
 * (displayName/photo/country/languages) come live from the real profile
 * contract via Redux (state.user.digitalAgentProfile) — never cached
 * locally; vouchedBy/invitedBy come from the local trust-graph cache in
 * digitalAgentStore.ts. Re-renders on either changing.
 */
export function useDigitalAgent(): UseDigitalAgent {
  const localAgent = useSyncExternalStore(subscribe, getAgent, getAgent);
  const digitalAgentProfile = useAppSelector((s) => s.user.digitalAgentProfile);

  const agent: DigitalAgent | null =
    digitalAgentProfile || localAgent
      ? {
          displayName: '',
          photo: '',
          country: '',
          languages: [],
          createdAt: localAgent?.createdAt ?? Date.now(),
          invitedBy: localAgent?.invitedBy,
          vouchedBy: localAgent?.vouchedBy ?? [],
          ...(digitalAgentProfile ?? {}),
        }
      : null;

  const hasAgent =
    !!agent && (!!agent.displayName || !!agent.country || (agent.languages?.length ?? 0) > 0);

  return {
    agent,
    isOnboarded: !!digitalAgentProfile,
    hasAgent,
    saveAgent,
    clearAgent,
  };
}
