import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getAgent,
  getProgress,
  saveAgent,
  saveProgress,
  clearAgent,
  resetOnboarding,
  startOver,
  ONBOARDING_STEP_COUNT,
  type DigitalAgent,
  type OnboardingProgress,
} from './digitalAgentStore';

export interface UseDigitalAgent {
  agent: DigitalAgent | null;
  progress: OnboardingProgress;
  isOnboarded: boolean;
  hasAgent: boolean;
  stepCount: number;
  saveAgent: (partial: Partial<DigitalAgent>) => void;
  saveProgress: (partial: Partial<OnboardingProgress>) => void;
  clearAgent: () => void;
  resetOnboarding: () => void;
  startOver: () => void;
}

/** Subscribe to the Digital Agent store; re-renders on any change (incl. other tabs). */
export function useDigitalAgent(): UseDigitalAgent {
  const agent = useSyncExternalStore(subscribe, getAgent, getAgent);
  const progress = useSyncExternalStore(subscribe, getProgress, getProgress);
  const hasAgent =
    !!agent && (!!agent.displayName || !!agent.country || agent.languages.length > 0);
  return {
    agent,
    progress,
    isOnboarded: progress.completed,
    hasAgent,
    stepCount: ONBOARDING_STEP_COUNT,
    saveAgent,
    saveProgress,
    clearAgent,
    resetOnboarding,
    startOver,
  };
}
