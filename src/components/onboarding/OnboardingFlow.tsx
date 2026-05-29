import React from 'react';
import LanePlaceholder from '../shared/LanePlaceholder';

/**
 * Lane A — Onboarding & Identity. Owns `src/components/onboarding/**`.
 * Routed at `/welcome/*` (add internal sub-routes here — never edit App.tsx).
 *
 * Replace this stub with the guided first-run journey:
 * invite → vouch (lightweight trust) → Digital Agent creation → consent → ready.
 */
const OnboardingFlow: React.FC = () => (
  <LanePlaceholder
    lane="Lane A — Onboarding & Identity"
    what="The guided first-run journey (invite → vouch → Digital Agent → consent) plugs in here, so a newcomer with an invite link gets to 'ready to participate' unaided, in their language."
  />
);

export default OnboardingFlow;
