import { useEffect, useMemo, useState } from 'react';
import { useFlowContract } from '../components/collaboration/flows/shared/useFlowContract';
import * as qvApi from '../components/collaboration/flows/voting/qvApi';
import * as approvalApi from '../components/collaboration/flows/voting/approvalApi';
import { useAppSelector } from '../store/hooks';
import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  type PublishedMandate,
  type MandateArticle,
  type MandateIndicator,
} from '../services/demo/fixtures/mandate';

interface ApprovalProposal {
  id: string;
  text: string;
  commitments?: string[];
  expertReviews?: { expert: string; metrics: string[]; note?: string; timestamp: number }[];
}

export interface UseMandateResult {
  mandate: PublishedMandate;
  loading: boolean;
  /** true when articles/indicators came from the winning solution's spine (not the fixture). */
  derived: boolean;
}

/**
 * FOR OURI — the S6 "consume". Derives the published mandate's articles
 * (commitments) and indicators (expert metrics) from the winning solution, read
 * back through the SAME approval/qv contracts the vote card uses. Resolves the
 * initiative's vote + proposals contracts (the QVFlow pattern), picks the winner
 * by qv results, joins to its approval twin, and maps its spine onto the mandate
 * shape. Falls back to the hand-authored fixture when no spine exists. No new
 * contract methods — reads get_results + get_proposals only.
 */
export function useMandate(initiativeId: string | undefined): UseMandateResult {
  const fixture = MANDATES_BY_KEY[initiativeId ?? ''] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];

  const parent = initiativeId ?? '';
  const { contractId: voteContractId, isReady: voteReady } = useFlowContract(
    parent, 'quadratic_vote', 'qv_contract.py', '', parent, 'voteContractId',
  );
  const { contractId: proposalsContractId, isReady: proposalsReady } = useFlowContract(
    `${parent}_proposals`, 'approval_voting', 'approval_contract.py', '', parent, 'proposalsContractId',
  );

  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [proposals, setProposals] = useState<Record<string, ApprovalProposal> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!initiativeId || !serverUrl || !publicKey) return;
    if (!voteReady || !voteContractId || !proposalsReady || !proposalsContractId) return;
    setLoading(true);
    (async () => {
      try {
        const [r, p] = await Promise.all([
          qvApi.getResults(serverUrl, publicKey, voteContractId),
          approvalApi.getProposals(serverUrl, publicKey, proposalsContractId),
        ]);
        if (cancelled) return;
        setResults((r as Record<string, number>) || {});
        setProposals((p as Record<string, ApprovalProposal>) || {});
      } catch {
        if (!cancelled) { setResults({}); setProposals({}); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initiativeId, serverUrl, publicKey, voteReady, voteContractId, proposalsReady, proposalsContractId]);

  const mandate = useMemo<PublishedMandate>(() => {
    if (!results || !proposals) return fixture;
    const winnerId = Object.entries(results).sort((a, b) => b[1] - a[1])[0]?.[0];
    const winner = winnerId ? proposals[winnerId] : undefined;
    const commitments = winner?.commitments ?? [];
    if (commitments.length === 0) return fixture; // graceful fallback — no spine
    const articles: MandateArticle[] = commitments.map((body, i) => ({ id: `art-${i + 1}`, title: '', body }));
    const metrics = (winner?.expertReviews ?? []).flatMap((rv) => rv.metrics);
    const indicators: MandateIndicator[] = metrics.length
      ? metrics.map((label) => ({ label, target: '' }))
      : fixture.indicators;
    return {
      ...fixture,
      articles,
      indicators,
      provenance: { ...fixture.provenance, voteWinner: winner?.text || fixture.provenance.voteWinner },
    };
  }, [results, proposals, fixture]);

  return { mandate, loading, derived: mandate !== fixture };
}
