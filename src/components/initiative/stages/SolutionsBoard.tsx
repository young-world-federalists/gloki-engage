import React, { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { ThumbsUp, Microscope, GitMerge, ChevronDown, ChevronUp } from 'lucide-react';

import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import * as api from '../../collaboration/flows/voting/approvalApi';
import type { ImpactAssessment } from '../../collaboration/flows/voting/approvalApi';
import type { Comment, CommentVote } from '../../collaboration/flows/discussion/discussionApi';
import { getInitiativeRoles, type InitiativeRoles } from '../../../services/initiativeRoles';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchCommunityMembers } from '../../../store/slices/communitiesSlice';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import { rankWriters, eligibleAssessors, ASSESSORS_PER_SOLUTION, type EligibilityRung } from '../../../utils/writerRank';
import { Button, UserIdentity, InfoDisclosure, Modal, ProgressBar, SourceLinks, SourcesInput, SearchableSelect } from '../../shared';
import { displayNameFor } from '../../../utils/displayName';
import type { SourceLink } from '../../../utils/sources';
import { TOP_CAUSES_ALIGN, type CauseRank } from '../../../utils/causes';
import { useT } from '../../../i18n';
import SolutionAuthorPanel from './SolutionAuthorPanel';
import TopCausesPanel from '../TopCausesPanel';
import CauseLine from '../CauseLine';
import ImpactAssessmentForm from '../ImpactAssessmentForm';
import ImpactAssessmentCard from '../ImpactAssessmentCard';
import type { TrustState } from '../../../services/trustModel';
import styles from './SolutionsBoard.module.scss';

export interface SolutionsBoardProps {
  initiativeId: string;
  communityId: string;
  /** Active community member count — denominator for the 50%-upvote threshold. */
  communityMemberCount?: number;
  /** Community display name, threaded through to the TopCausesPanel header's
   *  discussion status badge (S35 fix-round F4 pattern). */
  communityName?: string;
}

interface ExpertReview { expert: string; metrics: string[]; note?: string; assessment?: string; credentials?: string; sources?: SourceLink[]; timestamp: number }
interface MergeSuggestion { target: string; suggester: string; timestamp: number; decision?: 'accepted' | 'declined' }
interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number | string;
  coAuthors?: string[];
  commitments?: string[];
  metrics?: string[];        // author-proposed indicators (distinct from expert-validated)
  sources?: SourceLink[];    // author-attached citations
  expertReviewRequests?: string[];
  expertReviews?: ExpertReview[];
  mergeSuggestions?: MergeSuggestion[];
  mergedInto?: string;
  // S35 cause alignment (D5, F2): set once at creation from `add_proposal`'s
  // `cause_id` and never changed afterward. '' = proposed before any cause
  // was ranked.
  causeId?: string;
}

const CAUSE_LABEL_MAX = 90;

/**
 * Display-only label for a cause option in the "Add a solution" alignment
 * select (S35 fix-round F-preview-walk). Cause comment text can run to a full
 * sentence (~300 chars); the SearchableSelect trigger has no truncation of its
 * own, so build the truncated label here and keep `value` as the untouched
 * comment id. Cuts on a word boundary when one is close to the limit; never
 * trims the `#n ` rank prefix.
 */
const causeLabel = (rank: number, text: string): string => {
  const prefix = `#${rank} `;
  if (prefix.length + text.length <= CAUSE_LABEL_MAX) return `${prefix}${text}`;
  const budget = CAUSE_LABEL_MAX - prefix.length - 1; // room for trailing …
  let cut = text.slice(0, budget);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > budget * 0.6) cut = cut.slice(0, lastSpace);
  return `${prefix}${cut}…`;
};

/**
 * The folded "Evidence & expert review" for one solution (S15 recomposition).
 * Inline expand (button + aria-expanded + chevron + panel) — the same dive-on-tap
 * pattern InitiativeStageCard uses — NOT the kit InfoDisclosure, which opens a
 * Modal (built for rules/explainer prose, wrong for per-solution content). The
 * S35 cause-alignment chip (F2) is always shown as the first line — every
 * solution has one of the three cause states (addresses/unranked/beforeRank) —
 * the "Details" toggle below it still folds only when there's commitments,
 * author indicators, sources, or reviews to fold.
 * Its own open-state keeps SolutionsBoard from growing per-solution state.
 */
const SolutionEvidence: React.FC<{
  commitments: string[];
  indicators: string[];
  sources: SourceLink[];
  reviews: ExpertReview[];
  causeId?: string;
  causes: CauseRank[];
  authorName: (key: string) => string;
  profiles: Record<string, { country?: string } | undefined>;
  t: ReturnType<typeof useT>;
  /** Task 14 — this solution's impact assessments, folded separately (native
   *  `<details>`, same vocabulary as QVFlow's commitments/metrics folds)
   *  right after the cause chip and before the existing "Details" toggle. */
  assessments: ImpactAssessment[];
  trustOf: (key: string) => TrustState;
}> = ({ commitments, indicators, sources, reviews, causeId, causes, authorName, profiles, t, assessments, trustOf }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const reviewed = reviews.length > 0;
  const hasFoldedDetails = commitments.length > 0 || indicators.length > 0 || sources.length > 0 || reviewed;
  // W5 D1: commitments + evidence fold under one "Details" disclosure so the
  // card holds ≤5 co-equal blocks (text · byline · Details · actions).
  const label = reviewed
    ? t('mechanisms.approval.detailsToggleReviewed', 'Details ({n})', { n: reviews.length })
    : t('mechanisms.approval.detailsToggle', 'Details');

  // Cause chip (S35 F2, shared via CauseLine — Task 11). causeId is '' (or
  // absent, on older data) for a solution proposed before any cause had been
  // ranked. Otherwise resolve the cause's current rank from `causes` — it may
  // have fallen off the carried top 15, or (rarely) been deleted, in which
  // case its text isn't recoverable and only the "no longer ranked" badge shows.
  const found = causeId ? causes.find((c) => c.comment.id === causeId) : undefined;

  return (
    <div className={styles.evidence}>
      <CauseLine
        className={styles.causeChip}
        causeId={causeId}
        causeText={found?.comment.text}
        causeRank={found?.rank}
        causesLoaded={causes.length > 0}
      />
      {assessments.length > 0 && (
        <details className={styles.dcard}>
          <summary className={styles.dsummary}>
            <span>{t('impact.foldN', 'Impact assessments ({n})', { n: assessments.length })}</span>
            <ChevronDown size={16} className={styles.chev} aria-hidden />
          </summary>
          <div className={styles.dinner}>
            {assessments.map((a, i) => (
              <ImpactAssessmentCard key={a.author} assessment={a} index={i + 1} trustState={trustOf(a.author)} />
            ))}
          </div>
        </details>
      )}
      {hasFoldedDetails && (
      <button
        type="button"
        className={styles.evidenceToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        {label}
      </button>
      )}
      {open && hasFoldedDetails && (
        <div id={panelId} className={styles.evidencePanel}>
          {commitments.length > 0 && (
            <ul className={styles.commitments}>
              {commitments.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
          {indicators.length > 0 && (
            <div className={styles.metrics}>
              <p className={styles.metricsLabel}>{t('mechanisms.approval.authorMetricsLabel', 'Indicators proposed by the author')}</p>
              <ul>{indicators.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
          {sources.length > 0 && (
            <SourceLinks
              className={styles.sourceBlock}
              sources={sources}
              heading={t('mechanisms.approval.solutionSources', 'Sources')}
            />
          )}
          {reviewed && (
            <div className={styles.reviews}>
              <p className={styles.reviewsLabel}>{t('mechanisms.approval.expertReviewHeading', 'Expert review')}</p>
              {reviews.map((r) => (
                <div key={r.expert} className={styles.review}>
                  <div className={styles.reviewByline}>
                    <UserIdentity name={authorName(r.expert)} countryCode={profiles[r.expert]?.country} trustState="verified" size="sm" />
                    {r.credentials && <span className={styles.credentials}>{r.credentials}</span>}
                  </div>
                  {r.assessment && <p className={styles.assessment}>{r.assessment}</p>}
                  {r.metrics.length > 0 && (
                    <div className={styles.metrics}>
                      <p className={styles.metricsLabel}>{t('mechanisms.approval.metricsLabel', "How we’ll know it’s working")}</p>
                      <ul>{r.metrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  )}
                  {(r.sources?.length ?? 0) > 0 && (
                    <SourceLinks
                      className={styles.sourceBlock}
                      sources={r.sources!}
                      heading={t('mechanisms.approval.reviewSourcesHeading', 'Evidence')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Task 14 (D12) — the eligibility-panel copy naming a rung below `strict`. */
const rungCopy = (t: ReturnType<typeof useT>, rung: EligibilityRung): string | null => {
  switch (rung) {
    case 'strict': return t('impact.rung.strict', 'Open to the top 10 writers who have named a cause');
    case 'no-floor': return t('impact.rung.noFloor', 'Open to the top 10 writers');
    case 'top-25': return t('impact.rung.top25', 'Open to the top 25 writers');
    case 'any-verified': return t('impact.rung.anyVerified', 'Open to any verified member');
    default: return null;
  }
};

const SolutionsBoard: React.FC<SolutionsBoardProps> = ({ initiativeId, communityId, communityMemberCount = 0, communityName }) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    `${initiativeId}_proposals`,
    'approval_voting',
    'approval_contract.py',
    '',
    initiativeId,
    'proposalsContractId',
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [approvalCounts, setApprovalCounts] = useState<Record<string, number>>({});
  const [myApprovals, setMyApprovals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCommitments, setNewCommitments] = useState<string[]>(['', '', '']);
  const [newMetrics, setNewMetrics] = useState<string[]>(['', '']);
  const [newSources, setNewSources] = useState<SourceLink[]>([{ url: '' }]);
  const [submitting, setSubmitting] = useState(false);

  // S35 cause alignment (D5, F2): populated by TopCausesPanel's onCauses so
  // the board never fetches comments/votes a second time.
  const [causes, setCauses] = useState<CauseRank[]>([]);
  const handleCauses = useCallback((ranks: CauseRank[]) => setCauses(ranks), []);
  const alignable = causes.slice(0, TOP_CAUSES_ALIGN);
  const [newCauseId, setNewCauseId] = useState('');

  // Task 14 — the raw comments/votes behind `causes`, threaded through
  // TopCausesPanel's second callback (onDiscussionData) so `rankWriters` never
  // costs the board a second fetch of the discussion sub-contract.
  const [discussionComments, setDiscussionComments] = useState<Comment[]>([]);
  const [discussionVotes, setDiscussionVotes] = useState<CommentVote[]>([]);
  // Task 14 fix-round 1 (F1) — until this flips true, `discussionComments`/
  // `discussionVotes` are just their empty initial state (not "no discussion
  // exists"), so every writer's causeScore is 0 and the ladder falls to
  // `no-floor`. TopCausesPanel now calls onDiscussionData with empty arrays
  // on both its .catch and its no-contract path, so `discussionReady` still
  // becomes true (legitimately, with no cause floor) when there is nothing
  // to fetch or the fetch failed — see eligibilityReady below.
  const [discussionReady, setDiscussionReady] = useState(false);
  const handleDiscussionData = useCallback((d: { comments: Comment[]; votes: CommentVote[] }) => {
    setDiscussionComments(d.comments);
    setDiscussionVotes(d.votes);
    setDiscussionReady(true);
  }, []);

  // Task 14 — impact assessments, keyed by proposal id below via .filter, and
  // the per-solution "Assess impact" form state.
  const [assessments, setAssessments] = useState<ImpactAssessment[]>([]);
  const [assessFor, setAssessFor] = useState<string | null>(null);
  const [assessSubmitting, setAssessSubmitting] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  // Task 14 — verifiedKeys (the any-verified eligibility floor) comes from the
  // community's member list + trust, never a made-up enumeration. Mirrors
  // MandateActivityCard's dispatch/select pattern (fetch once, read from the
  // communities slice).
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [serverUrl, publicKey, communityId, communityMembers, dispatch]);
  const members = useMemo(
    () => (Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : []),
    [communityMembers, communityId],
  );
  const trust = useCommunityTrust(communityId);
  const verifiedKeys = useMemo(
    () => members.filter((pk) => trust.trustOf(pk) === 'verified'),
    [members, trust.trustOf],
  );
  // Task 14 fix-round 1 (F1) — `members` above always resolves to an array
  // (it falls back to `[]` before the slice has loaded), so it can't signal
  // "not loaded yet" on its own. Read the raw slice entry to know whether the
  // fetch has actually landed, and gate the assessor CTA + rung copy on both
  // that and `discussionReady` so a not-yet-eligible member is never shown
  // an eligible-looking screen while data is still in flight.
  const membersLoaded = Array.isArray(communityMembers[communityId]);
  const eligibilityReady = discussionReady && membersLoaded;

  // Sorted once per `proposals` change (a hook, so it must run unconditionally
  // on every render — computed here, ABOVE the early-return checks below,
  // rather than after them where the old plain `const` lived).
  const proposalList = useMemo(
    () => Object.values(proposals).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [proposals],
  );
  // Task 14 — writer ranking (D7/F7), memoised on its four true inputs so a
  // render that touches unrelated state (e.g. opening the merge banner) never
  // re-sorts the writer list.
  const writers = useMemo(
    () => rankWriters(discussionComments, discussionVotes, proposalList, approvalCounts),
    [discussionComments, discussionVotes, proposalList, approvalCounts],
  );

  const canSubmit =
    newText.trim().length > 0 &&
    newCommitments.some((c) => c.trim().length > 0) &&
    (alignable.length === 0 || newCauseId !== '');

  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((r) => { if (!cancelled) setRoles(r); });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);
  const isExpert = Boolean(publicKey && roles?.experts.includes(publicKey));

  // S33 — the author's decision on a merge suggestion pointing at their solution.
  const [decidingMerge, setDecidingMerge] = useState<string | null>(null);

  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [reviewMetrics, setReviewMetrics] = useState<string[]>(['', '']);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAssessment, setReviewAssessment] = useState('');
  const [reviewCredentials, setReviewCredentials] = useState('');
  const [reviewSources, setReviewSources] = useState<SourceLink[]>([{ url: '' }]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const canSubmitReview = reviewMetrics.some((m) => m.trim().length > 0);

  const handleDecideMerge = async (sourceId: string, targetId: string, decision: 'accepted' | 'declined') => {
    if (!serverUrl || !publicKey || !contractId) return;
    setDecidingMerge(targetId);
    try {
      await api.decideMergeSuggestion(serverUrl, publicKey, contractId, sourceId, targetId, decision);
      await fetchData();
    } catch (err) {
      console.error('Failed to decide merge suggestion:', err);
    } finally {
      setDecidingMerge(null);
    }
  };

  const resetReview = () => {
    setReviewFor(null); setReviewMetrics(['', '']); setReviewNote('');
    setReviewAssessment(''); setReviewCredentials(''); setReviewSources([{ url: '' }]);
  };

  const handleAddReview = async () => {
    if (!serverUrl || !publicKey || !contractId || !reviewFor || !canSubmitReview) return;
    setReviewSubmitting(true);
    try {
      const metrics = reviewMetrics.map((m) => m.trim()).filter(Boolean);
      await api.addExpertReview(
        serverUrl, publicKey, contractId, reviewFor, metrics,
        reviewNote.trim() || undefined,
        reviewAssessment.trim() || undefined,
        reviewSources,
        reviewCredentials.trim() || undefined,
      );
      resetReview();
      await fetchData();
    } catch (err) {
      console.error('Failed to add expert review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const resetAdd = () => {
    setNewText(''); setNewCommitments(['', '', '']); setNewMetrics(['', '']); setNewSources([{ url: '' }]); setAddOpen(false);
  };

  // Task 14 — "Assess impact". The demo seam emits no write events, so a
  // successful submit always ends in a refetch (never assumed local state);
  // this is the SAME re-fetch-after-write pattern every other action on this
  // board uses (handleAdd, handleAddReview, handleToggleApproval, …).
  const handleCloseAssess = () => {
    setAssessFor(null);
    setAssessError(null);
  };

  const handleSubmitAssess = async (values: Omit<ImpactAssessment, 'author' | 'timestamp' | 'proposalId'>) => {
    if (!serverUrl || !publicKey || !contractId || !assessFor) return;
    setAssessSubmitting(true);
    setAssessError(null);
    try {
      await api.addImpactAssessment(serverUrl, publicKey, contractId, { proposalId: assessFor, ...values });
      setAssessFor(null);
      await fetchData();
    } catch (err) {
      // F13: a thrown contract error (`throwIfContractError`, e.g. "max 3 per
      // proposal" or "one per author") must keep the modal open with the
      // message visible, not silently discard the user's input.
      console.error('Failed to add impact assessment:', err);
      setAssessError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssessSubmitting(false);
    }
  };

  // D5: the pre-select happens ONLY when the modal opens, from whatever
  // `alignable` holds right now — never on every render, so the user's own
  // change is never overwritten while the modal stays open.
  const handleOpenAdd = () => {
    // D5: causes must be loaded before the modal opens, or the cause
    // pre-select below silently falls back to "no cause" for a discussion
    // that actually has ranked causes.
    if (!discussionReady) return;
    setNewCauseId(alignable[0]?.comment.id ?? '');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!serverUrl || !publicKey || !contractId || !canSubmit) return;
    setSubmitting(true);
    try {
      const commitments = newCommitments.map((c) => c.trim()).filter(Boolean);
      const metrics = newMetrics.map((m) => m.trim()).filter(Boolean);
      const causeId = alignable.length > 0 ? newCauseId : '';
      await api.addProposal(serverUrl, publicKey, contractId, newText.trim(), [], commitments, newSources, metrics, causeId);
      resetAdd();
      await fetchData();
    } catch (err) {
      console.error('Failed to add solution:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const [{ proposals: p, counts }, myRes, impactRes] = await Promise.all([
        api.getProposalsAndCounts(serverUrl, publicKey, contractId),
        api.getMyApprovals(serverUrl, publicKey, contractId),
        api.getImpactAssessments(serverUrl, publicKey, contractId).catch(() => []),
      ]);
      setProposals((p as Record<string, Proposal>) || {});
      setApprovalCounts(counts || {});
      setMyApprovals((myRes as Record<string, boolean>) || {});
      setAssessments(impactRes || []);
    } catch (err) {
      console.error('Failed to fetch solutions:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId, publicKey, serverUrl]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  const handleToggleApproval = async (proposalId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    setTogglingId(proposalId);

    // Optimistic update: flip the approval immediately so the threshold bar
    // animates on tap rather than waiting for the round-trip. We snapshot the
    // current values so we can revert on error.
    const wasApproved = myApprovals[proposalId] === true;
    const prevCount = approvalCounts[proposalId] || 0;
    const optimisticCount = wasApproved ? Math.max(prevCount - 1, 0) : prevCount + 1;
    setMyApprovals((prev) => ({ ...prev, [proposalId]: !wasApproved }));
    setApprovalCounts((prev) => ({ ...prev, [proposalId]: optimisticCount }));

    try {
      if (wasApproved) {
        await api.withdrawApproval(serverUrl, publicKey, contractId, proposalId);
      } else {
        await api.approve(serverUrl, publicKey, contractId, proposalId);
      }
      // Reconcile to server truth after the write lands.
      await fetchData();
    } catch (err) {
      // Revert the optimistic change on error.
      setMyApprovals((prev) => ({ ...prev, [proposalId]: wasApproved }));
      setApprovalCounts((prev) => ({ ...prev, [proposalId]: prevCount }));
      console.error('Failed to toggle approval:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRequestReview = async (proposalId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    setRequestingId(proposalId);
    try {
      await api.requestExpertReview(serverUrl, publicKey, contractId, proposalId);
      await fetchData();
    } catch (err) {
      console.error('Failed to request expert review:', err);
    } finally {
      setRequestingId(null);
    }
  };

  const handlePickMergeTarget = async (targetId: string) => {
    if (!serverUrl || !publicKey || !contractId || !mergeSource || targetId === mergeSource) return;
    try {
      await api.suggestProposalMerge(serverUrl, publicKey, contractId, mergeSource, targetId);
      setMergeSource(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to suggest merge:', err);
      setMergeSource(null);
    }
  };

  // Your own byline reads "You", never your truncated key. The demo user has no
  // profile record, so displayNameFor would fall back to "aaaaaaaa…" — which is
  // what the whole seed avoids by authoring content as personas (S33).
  const authorName = (key: string): string =>
    publicKey && key === publicKey
      ? t('mechanisms.approval.author.you', 'You')
      : displayNameFor(profiles[key], key);

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.approval.setupError', 'Failed to set up solutions.')}</p>
      <Button variant="secondary" size="sm" onClick={retry}>{t('common.retry', 'Try again')}</Button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || t('mechanisms.approval.settingUp', 'Setting up solutions…')}</div>
  );
  if (loading && Object.keys(proposals).length === 0) return <div className={styles.loading}>{t('common.loading', 'Loading…')}</div>;

  // T1: solutions each backed by upvotes from >=50% of the community.
  const half = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const backedCount = proposalList.filter((p) => (approvalCounts[p.id] || 0) >= half).length;
  const T1_TARGET = 5;
  // T2: distinct experts who have actually reviewed (attached metrics), any solution.
  const reviewerSet = new Set<string>();
  proposalList.forEach((p) => (p.expertReviews ?? []).forEach((r) => reviewerSet.add(r.expert)));
  const expertsReviewed = reviewerSet.size;
  const T2_TARGET = 3;


  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <div className={styles.progressStat}>
          <div className={styles.progressTop}>
            <span className={styles.progressCount}>{backedCount}/{T1_TARGET}</span>
            <span className={styles.progressLabel}>{t('mechanisms.approval.progressBacked', 'solutions backed')}</span>
          </div>
          <ProgressBar
            value={Math.min(backedCount, T1_TARGET)}
            max={T1_TARGET}
            size="sm"
            variant="primary"
            label={t('mechanisms.approval.progressBacked', 'solutions backed')}
          />
        </div>
        <div className={styles.progressStat}>
          <div className={styles.progressTop}>
            <span className={styles.progressCount}>{expertsReviewed}/{T2_TARGET}</span>
            <span className={styles.progressLabel}>{t('mechanisms.approval.progressReviewed', 'experts reviewed')}</span>
          </div>
          <ProgressBar
            value={Math.min(expertsReviewed, T2_TARGET)}
            max={T2_TARGET}
            size="sm"
            variant="success"
            label={t('mechanisms.approval.progressReviewed', 'experts reviewed')}
          />
        </div>
      </div>

      <TopCausesPanel
        initiativeId={initiativeId}
        communityName={communityName}
        solutions={proposalList}
        onCauses={handleCauses}
        onDiscussionData={handleDiscussionData}
      />

      {/* The (i) sits beside the action it explains (S23) — not a lone icon
          floating above the board. */}
      <div className={styles.addRow}>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenAdd}
          disabled={!discussionReady}
          aria-disabled={!discussionReady}
          title={!discussionReady ? t('causes.align.loading', 'Loading causes…') : undefined}
        >
          + {t('mechanisms.approval.addSolutionCta', 'Add a solution to this problem')}
        </button>
        <InfoDisclosure
          label={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
          title={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
        >
          <p>{t('mechanisms.approval.helpBody', 'Add a solution and the commitments it needs. Upvote the ones you support, ask for expert review, or suggest two be merged. The strongest rise to the vote.')}</p>
        </InfoDisclosure>
      </div>

      <Modal
        isOpen={addOpen}
        onClose={resetAdd}
        title={t('mechanisms.approval.addSolutionTitle', 'Add a solution')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <Button variant="primary" onClick={handleAdd} loading={submitting} disabled={!canSubmit}>
            {t('mechanisms.approval.addSolutionSubmit', 'Add solution')}
          </Button>
        }
      >
        <div className={styles.addForm}>
          {alignable.length > 0 && (
            <>
              <p className={styles.commitPrompt}>{t('causes.align.prompt', 'Which cause does this address?')}</p>
              <p className={styles.commitHint}>{t('causes.align.hint', 'Your metrics and implementation measures should follow from this cause.')}</p>
              <div className={styles.causeSelect}>
                <SearchableSelect
                  options={alignable.map((c) => ({ value: c.comment.id, label: causeLabel(c.rank, c.comment.text) }))}
                  value={newCauseId}
                  onChange={setNewCauseId}
                  placeholder={t('causes.align.placeholder', 'Choose a cause')}
                />
              </div>
            </>
          )}
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.solutionPlaceholder', 'Describe your solution')}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className={styles.commitPrompt}>{t('mechanisms.approval.commitmentsPrompt', 'Implementation measures — who and what needs to change?')}</p>
          <p className={styles.commitHint}>{t('mechanisms.approval.commitmentsHint', 'List up to three commitments. At least one.')}</p>
          {newCommitments.map((c, i) => (
            <input
              key={i}
              className={styles.commitInput}
              type="text"
              placeholder={t('mechanisms.approval.commitmentPlaceholder', 'A commitment this solution needs')}
              value={c}
              maxLength={280}
              onChange={(e) => setNewCommitments((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <p className={styles.commitPrompt}>{t('mechanisms.approval.authorMetricsPrompt', 'Indicators you’d propose (optional)')}</p>
          <p className={styles.commitHint}>{t('mechanisms.approval.authorMetricsHint', 'How would you measure success? Experts can validate or add to these.')}</p>
          {newMetrics.map((m, i) => (
            <input
              key={i}
              className={styles.commitInput}
              type="text"
              placeholder={t('mechanisms.approval.metricPlaceholder', 'A measurable indicator')}
              value={m}
              maxLength={280}
              onChange={(e) => setNewMetrics((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <SourcesInput
            value={newSources}
            onChange={setNewSources}
            label={t('mechanisms.approval.sourcesLabel', 'Sources (optional)')}
            hint={t('mechanisms.approval.sourcesHint', 'Link to evidence that supports this solution.')}
          />
        </div>
      </Modal>

      <Modal
        isOpen={reviewFor !== null}
        onClose={resetReview}
        title={t('mechanisms.approval.addExpertReview', 'Add expert review')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <Button variant="primary" onClick={handleAddReview} loading={reviewSubmitting} disabled={!canSubmitReview}>
            {t('mechanisms.approval.submitReview', 'Submit review')}
          </Button>
        }
      >
        <div className={styles.addForm}>
          <p className={styles.commitPrompt}>{t('mechanisms.approval.credentialsPrompt', 'Your credentials')}</p>
          <p className={styles.commitHint}>{t('mechanisms.approval.credentialsHint', 'Shown with your review, e.g. “Epidemiologist, WHO”.')}</p>
          <input
            className={styles.commitInput}
            type="text"
            placeholder={t('mechanisms.approval.credentialsPlaceholder', 'Your role and affiliation')}
            value={reviewCredentials}
            maxLength={120}
            onChange={(e) => setReviewCredentials(e.target.value)}
          />
          <p className={styles.commitPrompt}>{t('mechanisms.approval.assessmentPrompt', 'Your assessment')}</p>
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.assessmentPlaceholder', 'What is your expert judgement of this solution?')}
            value={reviewAssessment}
            onChange={(e) => setReviewAssessment(e.target.value)}
            maxLength={700}
            rows={3}
          />
          <p className={styles.commitPrompt}>{t('mechanisms.approval.metricsPrompt', 'How will we know this is working?')}</p>
          {reviewMetrics.map((m, i) => (
            <input
              key={i}
              className={styles.commitInput}
              type="text"
              placeholder={t('mechanisms.approval.metricPlaceholder', 'A measurable indicator')}
              value={m}
              maxLength={280}
              onChange={(e) => setReviewMetrics((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <SourcesInput
            value={reviewSources}
            onChange={setReviewSources}
            label={t('mechanisms.approval.reviewSourcesLabel', 'Evidence (optional)')}
            hint={t('mechanisms.approval.reviewSourcesHint', 'Link to the research or data behind your assessment.')}
          />
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.reviewNotePlaceholder', 'A short review note (optional)')}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </div>
      </Modal>

      <ImpactAssessmentForm
        isOpen={assessFor !== null}
        onClose={handleCloseAssess}
        onSubmit={handleSubmitAssess}
        solutionText={assessFor ? (proposals[assessFor]?.text ?? '') : ''}
        submitting={assessSubmitting}
        error={assessError}
      />

      {mergeSource && (
        <div className={styles.mergeBanner} role="status">
          <GitMerge size={16} aria-hidden />
          <span>{t('mechanisms.approval.mergePickTarget', 'Tap the solution to merge this into')}</span>
          <button type="button" className={styles.mergeCancel} onClick={() => setMergeSource(null)}>
            {t('mechanisms.approval.mergeCancel', 'Cancel')}
          </button>
        </div>
      )}

      {proposalList.length === 0 ? (
        <p className={styles.noData}>{t('mechanisms.approval.noProposals', 'No solutions yet. Add one above.')}</p>
      ) : (
        <div className={styles.list}>
          {proposalList.map((p) => {
            const reviews = p.expertReviews ?? [];
            const reviewed = reviews.length > 0;
            const requestCount = p.expertReviewRequests?.length ?? 0;
            // S33 — the author's own view of this solution.
            const isMine = !!publicKey && p.author === publicKey;
            // Task 14 — this solution's impact assessments + assessor eligibility
            // (D7/D12 ladder). Existing assessments never rely on this render's
            // eligibility recompute — they always show, up to ASSESSORS_PER_SOLUTION.
            const solutionAssessments = assessments.filter((a) => a.proposalId === p.id);
            const elig = eligibleAssessors({ proposal: p, allProposals: proposalList, writers, verifiedKeys, existing: solutionAssessments });
            // F1 — eligibility is only trustworthy once discussion data and the
            // members list have both loaded; before then, don't offer the CTA
            // or name a rung (the count line below is always safe to show).
            const canAssessThis = eligibilityReady && !!publicKey && elig.keys.includes(publicKey);
            const rungNote = eligibilityReady && elig.keys.length > 0 && solutionAssessments.length < ASSESSORS_PER_SOLUTION ? rungCopy(t, elig.rung) : null;
            return (
              <div
                key={p.id}
                className={[
                  styles.solution,
                  mergeSource && p.id === mergeSource ? styles.mergeSourceCard : '',
                  mergeSource && p.id !== mergeSource ? styles.mergeTargetCard : '',
                ].filter(Boolean).join(' ')}
                {...(mergeSource && p.id !== mergeSource
                  ? { role: 'button', tabIndex: 0,
                      onClick: () => handlePickMergeTarget(p.id),
                      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePickMergeTarget(p.id); } } }
                  : {})}
              >
                {mergeSource && p.id !== mergeSource && (
                  <p className={styles.mergeHint}>{t('mechanisms.approval.mergeIntoThis', 'Tap to merge into this')}</p>
                )}
                <p className={styles.text}>{p.text}</p>
                <div className={styles.byline}>
                  <UserIdentity name={authorName(p.author)} countryCode={profiles[p.author]?.country} size="sm" />
                  {reviewed && (
                    <span className={styles.reviewedTag}>{t('mechanisms.approval.expertReviewed', 'expert reviewed')}</span>
                  )}
                </div>
                {requestCount > 0 && !reviewed && (
                  <p className={styles.reviewStatus}>
                    {t('mechanisms.approval.reviewPending', 'Review requested by {count} — awaiting an expert', { count: requestCount })}
                  </p>
                )}
                <SolutionEvidence
                  commitments={p.commitments ?? []}
                  indicators={p.metrics ?? []}
                  sources={p.sources ?? []}
                  reviews={reviews}
                  causeId={p.causeId}
                  causes={causes}
                  authorName={authorName}
                  profiles={profiles}
                  t={t}
                  assessments={solutionAssessments}
                  trustOf={trust.trustOf}
                />
                {!mergeSource && (
                  <div className={styles.impactChin}>
                    <span className={styles.impactCount}>
                      {t('impact.count', 'Impact assessments · {n}/3', { n: solutionAssessments.length })}
                    </span>
                    {canAssessThis && (
                      <button type="button" className={styles.impactCta} onClick={() => setAssessFor(p.id)}>
                        {t('impact.cta', 'Assess impact')}
                      </button>
                    )}
                    {rungNote && <p className={styles.impactRungNote}>{rungNote}</p>}
                  </div>
                )}
                {!mergeSource && (
                  <div className={styles.actionRow}>
                    {/* Icon+count on top, short caption beneath (D1 finding). The
                        visible caption is the accessible name — no mismatched
                        aria-label (WCAG 2.5.3 / voice control). aria-pressed on the
                        two toggles announces state; merge stays a plain action. */}
                    <button
                      className={`${styles.actionBtn} ${myApprovals[p.id] ? styles.actionBtnActive : ''}`}
                      onClick={() => handleToggleApproval(p.id)}
                      disabled={togglingId === p.id}
                      aria-pressed={!!myApprovals[p.id]}
                    >
                      <span className={styles.actionTop}>
                        <ThumbsUp size={16} aria-hidden />
                        <span>{approvalCounts[p.id] || 0}</span>
                      </span>
                      <span className={styles.actionCaption}>{t('mechanisms.approval.upvoteCaption', 'Back this')}</span>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${publicKey && p.expertReviewRequests?.includes(publicKey) ? styles.actionBtnActive : ''}`}
                      onClick={() => handleRequestReview(p.id)}
                      disabled={requestingId === p.id}
                      aria-pressed={!!(publicKey && p.expertReviewRequests?.includes(publicKey))}
                    >
                      <span className={styles.actionTop}>
                        <Microscope size={16} aria-hidden />
                        <span>{p.expertReviewRequests?.length ?? 0}</span>
                      </span>
                      <span className={styles.actionCaption}>{t('mechanisms.approval.requestReviewCaption', 'Request expert')}</span>
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setMergeSource(p.id)}
                    >
                      <span className={styles.actionTop}>
                        <GitMerge size={16} aria-hidden />
                      </span>
                      <span className={styles.actionCaption}>{t('mechanisms.approval.suggestMergeCaption', 'Suggest merge')}</span>
                    </button>
                  </div>
                )}
                {isExpert && !mergeSource && (
                  <button type="button" className={styles.expertAddBtn} onClick={() => setReviewFor(p.id)}>
                    {t('mechanisms.approval.addExpertReview', 'Add expert review')}
                  </button>
                )}
                {/* S33 — only the author of THIS solution sees what is waiting on
                    them. Everyone else sees the card exactly as before. */}
                {isMine && !mergeSource && (
                  <SolutionAuthorPanel
                    reviewRequests={p.expertReviewRequests ?? []}
                    reviewed={reviewed}
                    mergeSuggestions={p.mergeSuggestions ?? []}
                    targetTextOf={(id) => {
                      const target = proposals[id];
                      if (!target) return t('mechanisms.approval.author.unknownTarget', 'another solution');
                      return target.text.length > 120 ? `${target.text.slice(0, 120)}…` : target.text;
                    }}
                    authorName={authorName}
                    profiles={profiles}
                    onDecideMerge={(targetId, decision) => handleDecideMerge(p.id, targetId, decision)}
                    decidingTarget={decidingMerge}
                    t={t}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolutionsBoard;
