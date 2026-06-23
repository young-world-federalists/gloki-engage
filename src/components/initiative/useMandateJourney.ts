import { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getTally } from '../collaboration/flows/voting/problemVoteApi';
import {
  fetchDiscussionSummary,
  fetchProposalsSummary,
  fetchVoteSummary,
  type DiscussionSummary,
  type ProposalsSummary,
  type VoteSummary,
} from '../collaboration/flows/shared/stageMetrics';

export interface UseMandateJourneyResult {
  /** "Seconds" on the problem (≥0). 0 if unknown. */
  problemUp: number;
  discussion: DiscussionSummary | null;
  proposals: ProposalsSummary | null;
  vote: VoteSummary | null;
}

/**
 * Read-zone data for the Mandate card's {@link JourneyRecap} — the whole arc that
 * culminates in the published mandate. Lifted out of `InitiativeStagePanel` so the
 * mandate Engage slot owns its own data. Every read flows through the `api.ts`
 * seam (the problem-vote tally + the three `stageMetrics` summaries) and degrades
 * silently to `null`/`0` on failure (old initiatives, missing sub-contracts,
 * network hiccups) — the recap is narrative decoration, never load-bearing.
 */
export function useMandateJourney(initiativeId: string): UseMandateJourneyResult {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [problemUp, setProblemUp] = useState(0);
  const [discussion, setDiscussion] = useState<DiscussionSummary | null>(null);
  const [proposals, setProposals] = useState<ProposalsSummary | null>(null);
  const [vote, setVote] = useState<VoteSummary | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;

    // Problem "seconds" — read-only (no join; that's the active ProblemVoteFlow's job).
    (async () => {
      try {
        const stage = await resolveInitiativeStageContract(
          serverUrl,
          publicKey,
          initiativeId,
          'problemVoteContractId',
        );
        if (!stage?.contractId) return;
        const tally = await getTally(serverUrl, publicKey, stage.contractId);
        if (!cancelled && tally && typeof tally === 'object') {
          setProblemUp(Number((tally as { up?: number }).up ?? 0));
        }
      } catch {
        /* non-blocking */
      }
    })();

    // Compact stage summaries — each returns null silently on old initiatives.
    Promise.allSettled([
      fetchDiscussionSummary(serverUrl, publicKey, initiativeId),
      fetchProposalsSummary(serverUrl, publicKey, initiativeId),
      fetchVoteSummary(serverUrl, publicKey, initiativeId),
    ]).then(([d, p, v]) => {
      if (cancelled) return;
      setDiscussion(d.status === 'fulfilled' ? d.value : null);
      setProposals(p.status === 'fulfilled' ? p.value : null);
      setVote(v.status === 'fulfilled' ? v.value : null);
    });

    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  return { problemUp, discussion, proposals, vote };
}
