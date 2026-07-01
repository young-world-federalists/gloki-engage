import React, { useState, useEffect, useCallback, useId } from 'react';
import { ThumbsUp, Microscope, GitMerge, ChevronDown, ChevronUp } from 'lucide-react';

import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import * as api from '../../collaboration/flows/voting/approvalApi';
import { getInitiativeRoles, type InitiativeRoles } from '../../../services/initiativeRoles';
import { useAppSelector } from '../../../store/hooks';
import { Button, UserIdentity, InfoDisclosure, Modal, SourceLinks, SourcesInput } from '../../shared';
import { displayNameFor } from '../../../utils/displayName';
import type { SourceLink } from '../../../utils/sources';
import { useT } from '../../../i18n';
import styles from './SolutionsBoard.module.scss';

export interface SolutionsBoardProps {
  initiativeId: string;
  communityId: string;
  /** Active community member count — denominator for the 50%-upvote threshold. */
  communityMemberCount?: number;
}

interface ExpertReview { expert: string; metrics: string[]; note?: string; assessment?: string; credentials?: string; sources?: SourceLink[]; timestamp: number }
interface MergeSuggestion { target: string; suggester: string; timestamp: number }
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
}

/**
 * The folded "Evidence & expert review" for one solution (S15 recomposition).
 * Inline expand (button + aria-expanded + chevron + panel) — the same dive-on-tap
 * pattern InitiativeStageCard uses — NOT the kit InfoDisclosure, which opens a
 * Modal (built for rules/explainer prose, wrong for per-solution content). Renders
 * only when there's something to fold: author indicators, sources, or reviews.
 * Its own open-state keeps SolutionsBoard from growing per-solution state.
 */
const SolutionEvidence: React.FC<{
  indicators: string[];
  sources: SourceLink[];
  reviews: ExpertReview[];
  authorName: (key: string) => string;
  profiles: Record<string, { country?: string } | undefined>;
  t: ReturnType<typeof useT>;
}> = ({ indicators, sources, reviews, authorName, profiles, t }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const reviewed = reviews.length > 0;
  const label = reviewed
    ? t('mechanisms.approval.evidenceReviewToggle', 'Evidence & expert review ({n})', { n: reviews.length })
    : t('mechanisms.approval.evidenceToggle', 'Evidence & indicators');

  return (
    <div className={styles.evidence}>
      <button
        type="button"
        className={styles.evidenceToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
        {label}
      </button>
      {open && (
        <div id={panelId} className={styles.evidencePanel}>
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

const SolutionsBoard: React.FC<SolutionsBoardProps> = ({ initiativeId, communityMemberCount = 0 }) => {
  const t = useT();
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

  const canSubmit = newText.trim().length > 0 && newCommitments.some((c) => c.trim().length > 0);

  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((r) => { if (!cancelled) setRoles(r); });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);
  const isExpert = Boolean(publicKey && roles?.experts.includes(publicKey));

  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [reviewMetrics, setReviewMetrics] = useState<string[]>(['', '']);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAssessment, setReviewAssessment] = useState('');
  const [reviewCredentials, setReviewCredentials] = useState('');
  const [reviewSources, setReviewSources] = useState<SourceLink[]>([{ url: '' }]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const canSubmitReview = reviewMetrics.some((m) => m.trim().length > 0);

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

  const handleAdd = async () => {
    if (!serverUrl || !publicKey || !contractId || !canSubmit) return;
    setSubmitting(true);
    try {
      const commitments = newCommitments.map((c) => c.trim()).filter(Boolean);
      const metrics = newMetrics.map((m) => m.trim()).filter(Boolean);
      await api.addProposal(serverUrl, publicKey, contractId, newText.trim(), [], commitments, newSources, metrics);
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
      const [{ proposals: p, counts }, myRes] = await Promise.all([
        api.getProposalsAndCounts(serverUrl, publicKey, contractId),
        api.getMyApprovals(serverUrl, publicKey, contractId),
      ]);
      setProposals((p as Record<string, Proposal>) || {});
      setApprovalCounts(counts || {});
      setMyApprovals((myRes as Record<string, boolean>) || {});
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

  const authorName = (key: string): string => displayNameFor(profiles[key], key);

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

  const proposalList = Object.values(proposals).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // T1: solutions each backed by upvotes from >=50% of the community.
  const half = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const backedCount = proposalList.filter((p) => (approvalCounts[p.id] || 0) >= half).length;
  const T1_TARGET = 5;
  // T2: distinct experts who have actually reviewed (attached metrics), any solution.
  const reviewerSet = new Set<string>();
  proposalList.forEach((p) => (p.expertReviews ?? []).forEach((r) => reviewerSet.add(r.expert)));
  const expertsReviewed = reviewerSet.size;
  const T2_TARGET = 3;

  const pct = (n: number, target: number) => `${Math.min(Math.round((n / target) * 100), 100)}%`;

  return (
    <div className={styles.container}>
      <div className={styles.helpSection}>
        <InfoDisclosure
          label={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
          title={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
        >
          <p>{t('mechanisms.approval.helpBody', 'Add a solution and the commitments it needs. Upvote the ones you support, ask for expert review, or suggest two be merged. The strongest rise to the vote.')}</p>
        </InfoDisclosure>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressStat}>
          <div className={styles.progressTop}>
            <span className={styles.progressCount}>{backedCount}/{T1_TARGET}</span>
            <span className={styles.progressLabel}>{t('mechanisms.approval.progressBacked', 'solutions backed')}</span>
          </div>
          <div className={styles.track}><div className={styles.fill} style={{ width: pct(backedCount, T1_TARGET) }} /></div>
        </div>
        <div className={styles.progressStat}>
          <div className={styles.progressTop}>
            <span className={styles.progressCount}>{expertsReviewed}/{T2_TARGET}</span>
            <span className={styles.progressLabel}>{t('mechanisms.approval.progressReviewed', 'experts reviewed')}</span>
          </div>
          <div className={styles.track}><div className={`${styles.fill} ${styles.fillSuccess}`} style={{ width: pct(expertsReviewed, T2_TARGET) }} /></div>
        </div>
      </div>

      <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
        + {t('mechanisms.approval.addSolutionCta', 'Add a solution to this problem')}
      </button>

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
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.solutionPlaceholder', 'Describe your solution')}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className={styles.commitPrompt}>{t('mechanisms.approval.commitmentsPrompt', 'Who and what needs to change?')}</p>
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
            const hasEvidence = (p.metrics?.length ?? 0) > 0 || (p.sources?.length ?? 0) > 0 || reviewed;
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
                {(p.commitments?.length ?? 0) > 0 && (
                  <ul className={styles.commitments}>
                    {p.commitments!.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
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
                {hasEvidence && (
                  <SolutionEvidence
                    indicators={p.metrics ?? []}
                    sources={p.sources ?? []}
                    reviews={reviews}
                    authorName={authorName}
                    profiles={profiles}
                    t={t}
                  />
                )}
                {!mergeSource && (
                  <div className={styles.actionRow}>
                    <button
                      className={`${styles.actionBtn} ${myApprovals[p.id] ? styles.actionBtnActive : ''}`}
                      onClick={() => handleToggleApproval(p.id)}
                      disabled={togglingId === p.id}
                      aria-label={t('mechanisms.approval.upvote', 'Upvote')}
                    >
                      <ThumbsUp size={16} aria-hidden />
                      <span>{approvalCounts[p.id] || 0}</span>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${publicKey && p.expertReviewRequests?.includes(publicKey) ? styles.actionBtnActive : ''}`}
                      onClick={() => handleRequestReview(p.id)}
                      disabled={requestingId === p.id}
                      aria-label={t('mechanisms.approval.requestReview', 'Request expert review')}
                    >
                      <Microscope size={16} aria-hidden />
                      <span>{p.expertReviewRequests?.length ?? 0}</span>
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setMergeSource(p.id)}
                      aria-label={t('mechanisms.approval.suggestMerge', 'Suggest a merge')}
                    >
                      <GitMerge size={16} aria-hidden />
                    </button>
                  </div>
                )}
                {isExpert && !mergeSource && (
                  <button type="button" className={styles.expertAddBtn} onClick={() => setReviewFor(p.id)}>
                    {t('mechanisms.approval.addExpertReview', 'Add expert review')}
                  </button>
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
