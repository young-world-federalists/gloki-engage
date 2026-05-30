import React from 'react';
import CountryPresence from '../CountryPresence';
import { useT } from '../../../i18n';

export interface ParticipationSummaryProps {
  /** Per-country participant counts. */
  participation: { code: string; participants: number }[];
  /** Max flags before a "+N" chip. */
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The reusable presence header: an overlapping flag cluster (via CountryPresence)
 * captioned "{people} participants from {countries} countries". Drop it atop a
 * feed, a discussion, or a stage to make cross-border participation felt.
 */
const ParticipationSummary: React.FC<ParticipationSummaryProps> = ({
  participation,
  max = 6,
  size = 'md',
  className,
}) => {
  const t = useT();
  if (participation.length === 0) return null;

  const sorted = [...participation].sort((a, b) => b.participants - a.participants);
  const people = sorted.reduce((sum, c) => sum + c.participants, 0);
  const countries = sorted.length;
  const codes = sorted.map((c) => c.code);

  const label = t(
    'presence.participantsFrom',
    '{people} participants from {countries} countries',
    { people, countries },
  );

  return (
    <CountryPresence countries={codes} max={max} size={size} label={label} className={className} />
  );
};

export default ParticipationSummary;
