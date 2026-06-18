import React from 'react';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import type { BadgeTone } from '../shared';

export interface StageMeta {
  tone: BadgeTone;
  icon: React.ComponentType<{ size?: number }>;
  labelKey: string;
  labelDefault: string;
}

export const STAGE_META: Record<string, StageMeta> = {
  problem:    { tone: 'error',   icon: AlertCircle,   labelKey: 'stage.problem',    labelDefault: 'Problem' },
  discussion: { tone: 'warning', icon: MessageCircle, labelKey: 'stage.discussion', labelDefault: 'Discussion' },
  proposals:  { tone: 'info',    icon: Lightbulb,     labelKey: 'stage.proposals',  labelDefault: 'Proposals' },
  vote:       { tone: 'primary', icon: Vote,          labelKey: 'stage.vote',       labelDefault: 'Vote' },
  mandate:    { tone: 'success', icon: ScrollText,    labelKey: 'stage.mandate',    labelDefault: 'Mandate' },
};
