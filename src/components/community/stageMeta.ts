import React from 'react';
import { AlertCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import type { BadgeTone } from '../shared';

export interface StageMeta {
  tone: BadgeTone;
  icon: React.ComponentType<{ size?: number }>;
  labelKey: string;
  labelDefault: string;
}

// No `discussion` entry (W3, campaign §5 rule 10): discussion is a function,
// not a peer stage — consumers fall back to the Problem badge, because an
// initiative in the Problem→Solutions gap is still a problem being discussed.
export const STAGE_META: Record<string, StageMeta> = {
  problem:    { tone: 'error',   icon: AlertCircle,   labelKey: 'stage.problem',    labelDefault: 'Problem' },
  proposals:  { tone: 'info',    icon: Lightbulb,     labelKey: 'stage.proposals',  labelDefault: 'Solutions' },
  vote:       { tone: 'primary', icon: Vote,          labelKey: 'stage.vote',       labelDefault: 'Vote' },
  mandate:    { tone: 'success', icon: ScrollText,    labelKey: 'stage.mandate',    labelDefault: 'Mandate' },
};
