import { useEffect, useMemo, useState } from 'react';
import { useFlowContract } from '../components/collaboration/flows/shared/useFlowContract';
import * as qvApi from '../components/collaboration/flows/voting/qvApi';
import * as approvalApi from '../components/collaboration/flows/voting/approvalApi';
import { resolveInitiativeStageContract } from '../services/contracts/initiative';
import { getComments, getCommentVotes } from '../components/collaboration/flows/discussion/discussionApi';
import { rankCauses, type CauseRank } from '../utils/causes';
import { getRatification } from '../services/mandateRatification';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../store/slices/communitiesSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  isMandateRatified,
  type PublishedMandate,
  type MandateArticle,
  type MandateIndicator,
  type MandateRatification,
} from '../services/demo/fixtures/mandate';

interface ApprovalProposal {
  id: string;
  text: string;
  commitments?: string[];
  expertReviews?: { expert: string; metrics: string[]; note?: string; timestamp: number }[];
  causeId?: string;
}

export interface UseMandateResult {
  mandate: PublishedMandate;
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
export function useMandate(
  initiativeId: string | undefined,
  communityId?: string,
  refreshToken: number = 0,
): UseMandateResult {
  // `initiativeId` is a deployed contract id, not a fixture key, so this lookup
  // currently resolves via DEFAULT_MANDATE_KEY. Kept id-keyed for when a
  // contractId→fixture map exists; the contract read-back below uses the real id.
  const fixture = MANDATES_BY_KEY[initiativeId ?? ''] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];

  const parent = initiativeId ?? '';
  const { contractId: voteContractId, isReady: voteReady } = useFlowContract(
    parent, 'quadratic_vote', 'qv_contract.py', '', parent, 'voteContractId',
  );
  const { contractId: proposalsContractId, isReady: proposalsReady } = useFlowContract(
    `${parent}_proposals`, 'approval_voting', 'approval_contract.py', '', parent, 'proposalsContractId',
  );

  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);

  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [proposals, setProposals] = useState<Record<string, ApprovalProposal> | null>(null);
  const [voters, setVoters] = useState<number | null>(null);
  const [ratification, setRatification] = useState<MandateRatification | null>(null);
  // Causes ranked in the discussion contract (S35 F2, Task 11) — resolved
  // read-only alongside the vote/proposals contracts below, so the winning
  // solution's cause alignment can be shown on the mandate card.
  const [causes, setCauses] = useState<CauseRank[]>([]);

  // Clear derived state the instant the initiative changes so the memo falls back
  // to the new id's fixture rather than flashing the previous mandate's spine
  // until the fresh read-back lands.
  useEffect(() => {
    setResults(null);
    setProposals(null);
    setVoters(null);
    setRatification(null);
    setCauses([]);
  }, [initiativeId]);

  // Eligible denominator N — mirror MandateActivityCard: fetch the community's
  // member + active-member counts so turnout reads "X of N".
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
    if (communityActiveMembers[communityId] === undefined) {
      dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [serverUrl, publicKey, communityId, communityMembers, communityActiveMembers, dispatch]);

  useEffect(() => {
    let cancelled = false;
    if (!initiativeId || !serverUrl || !publicKey) return;
    if (!voteReady || !voteContractId || !proposalsReady || !proposalsContractId) return;
    (async () => {
      try {
        const [r, p, allocs, ratif] = await Promise.all([
          qvApi.getResults(serverUrl, publicKey, voteContractId),
          approvalApi.getProposals(serverUrl, publicKey, proposalsContractId),
          qvApi.getAllocations(serverUrl, publicKey, voteContractId),
          getRatification(serverUrl, publicKey, initiativeId),
        ]);
        if (cancelled) return;
        setResults((r as Record<string, number>) || {});
        setProposals((p as Record<string, ApprovalProposal>) || {});
        setVoters(Object.keys((allocs as Record<string, unknown>) || {}).length);
        setRatification(ratif);
      } catch {
        if (!cancelled) { setResults({}); setProposals({}); setVoters(0); setRatification(null); }
      }
      // Causes (S35 F2, Task 11) — read-only resolve of the discussion
      // sub-contract, same pattern as TopCausesPanel/DiscussionPill: never
      // useFlowContract, which can deploy + register from a display path.
      try {
        const discRef = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'discussionContractId');
        if (cancelled) return;
        if (discRef?.contractId) {
          const [comments, votes] = await Promise.all([
            getComments(serverUrl, publicKey, discRef.contractId),
            getCommentVotes(serverUrl, publicKey, discRef.contractId),
          ]);
          if (!cancelled) setCauses(rankCauses(comments, votes));
        } else if (!cancelled) {
          setCauses([]);
        }
      } catch {
        if (!cancelled) setCauses([]);
      }
    })();
    return () => { cancelled = true; };
  }, [initiativeId, serverUrl, publicKey, voteReady, voteContractId, proposalsReady, proposalsContractId, refreshToken]);

  const eligible = communityId
    ? (communityActiveMembers[communityId]
        ?? (Array.isArray(communityMembers[communityId]) ? communityMembers[communityId].length : 0))
    : 0;

  const mandate = useMemo<PublishedMandate>(() => {
    if (!results || !proposals) return fixture;
    const winnerId = Object.entries(results).sort((a, b) => b[1] - a[1])[0]?.[0];
    const winner = winnerId ? proposals[winnerId] : undefined;
    const commitments = winner?.commitments ?? [];
    if (commitments.length === 0) return fixture; // graceful fallback — no spine
    const articles: MandateArticle[] = commitments.map((body, i) => ({ id: `art-${i + 1}`, title: '', body }));
    // De-dupe labels: two reviews on the winner could name the same metric,
    // which would collide on React keys and map many→one in the ratification merge.
    const metrics = [...new Set((winner?.expertReviews ?? []).flatMap((rv) => rv.metrics))];
    // Merge host/expert-entered target/baseline/cadence onto each derived
    // indicator by label; unfilled indicators keep empty strings (pending).
    const indicators: MandateIndicator[] = metrics.length
      ? metrics.map((label) => {
          const r = ratification?.indicators[label];
          return { label, target: r?.target ?? '', baseline: r?.baseline ?? '', cadence: r?.cadence ?? '' };
        })
      : fixture.indicators;
    // Turnout: prefer live counts, fall back to the fixture's seeded numbers so
    // the flagship still reads sensibly before member/allocation reads land.
    const liveEligible = eligible > 0 ? eligible : fixture.provenance.eligible;
    const liveVoters = voters ?? fixture.provenance.voters;
    // Cause alignment (S35 F2, Task 11) — the winning solution's causeId,
    // resolved to text/rank against the discussion contract's current ranks
    // (the same "found or unranked" lookup CauseLine's other three callers do).
    const foundCause = winner?.causeId ? causes.find((c) => c.comment.id === winner.causeId) : undefined;
    return {
      ...fixture,
      status: isMandateRatified(indicators) ? 'ratified' : 'published',
      articles,
      indicators,
      provenance: {
        ...fixture.provenance,
        voteWinner: winner?.text || fixture.provenance.voteWinner,
        eligible: liveEligible,
        voters: liveVoters,
      },
      causeId: winner?.causeId,
      causeText: foundCause?.comment.text,
      causeRank: foundCause?.rank,
    };
  }, [results, proposals, ratification, voters, eligible, fixture, causes]);

  return { mandate };
}
