import React, { useMemo, useState } from 'react';
import { GitMerge, Sparkles, Award, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Badge, Banner, Button, CountryFlag, EmptyState } from '../../../shared';
import { useT, type TFunction } from '../../../../i18n';
import {
  MERGEABLE_PROPOSALS,
  MERGE_SUGGESTIONS,
  EXPERT_REVIEWS,
  deliberationParticipant,
  expertProfile,
  type MergeableProposal,
  type ExpertReview,
} from '../../../../services/demo/fixtures/deliberation';
import styles from './ProposalMergePanel.module.scss';

const AuthorTag: React.FC<{ authorKey: string; t: TFunction; currentUserKey: string }> = ({ authorKey, t, currentUserKey }) => {
  const p = deliberationParticipant(authorKey);
  const name = authorKey === currentUserKey ? t('deliberation.you', 'You') : p.name;
  return (
    <span className={styles.authorTag}>
      <span className={styles.avatar} aria-hidden>{p.initials}</span>
      {name}
      {p.country && <CountryFlag code={p.country} size="sm" />}
    </span>
  );
};

const ExpertReviewBlock: React.FC<{ review: ExpertReview; t: TFunction }> = ({ review, t }) => {
  const expert = expertProfile(review.expertKey);
  if (!expert) return null;
  return (
    <div className={styles.reviewNote}>
      <div className={styles.reviewExpert}>
        <CountryFlag code={expert.country} size="sm" />
        <strong>{expert.name}</strong>
        <span className={styles.reviewField}>{expert.field}</span>
      </div>
      <p className={styles.reviewText}>“{review.note}”</p>
      <span className={styles.reviewMeta}>{t('deliberation.merge.reviewMeta', 'Independent expert review')}</span>
    </div>
  );
};

/**
 * C3 — Bring similar proposals together, and surface expert review. Merging is
 * framed as generous, not bureaucratic: nothing is lost, and the joining
 * author keeps co-authorship. UI-only, optimistic local state.
 */
const ProposalMergePanel: React.FC = () => {
  const t = useT();
  const currentUserKey = 'me'; // viewer; proposals are authored by personas in the mock

  const proposalById = useMemo(
    () => Object.fromEntries(MERGEABLE_PROPOSALS.map((p) => [p.id, p])) as Record<string, MergeableProposal>,
    [],
  );
  const reviewByProposal = useMemo(
    () => Object.fromEntries(EXPERT_REVIEWS.map((r) => [r.proposalId, r])) as Record<string, ExpertReview>,
    [],
  );

  const [merged, setMerged] = useState<Record<string, boolean>>({});
  const [coAuthors, setCoAuthors] = useState<Record<string, string[]>>({});
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const doMerge = (sourceId: string, targetId: string) => {
    const source = proposalById[sourceId];
    const sourcePerson = deliberationParticipant(source.author);
    setMerged((prev) => ({ ...prev, [sourceId]: true }));
    setCoAuthors((prev) => {
      const existing = prev[targetId] ?? [];
      return existing.includes(source.author) ? prev : { ...prev, [targetId]: [...existing, source.author] };
    });
    setBanner(
      t(
        'deliberation.merge.celebrate',
        "🎉 Ideas combined — {name}'s proposal joined another. Nothing is lost: {first} is now a co-author.",
        { name: sourcePerson.name, first: sourcePerson.name.split(' ')[0] },
      ),
    );
  };

  const activeSuggestions = MERGE_SUGGESTIONS.filter((s) => !merged[s.sourceId]);
  const visibleProposals = MERGEABLE_PROPOSALS.filter((p) => !merged[p.id]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <GitMerge size={16} aria-hidden /> {t('deliberation.merge.heading', 'Similar proposals')}
        </h3>
      </div>
      <p className={styles.lede}>
        {t('deliberation.merge.lede', 'When two ideas overlap, combine them so support gathers behind one stronger proposal.')}
      </p>

      {banner && (
        <Banner tone="success" onDismiss={() => setBanner(null)} dismissLabel={t('deliberation.action.dismiss', 'Dismiss')}>
          {banner}
        </Banner>
      )}

      {/* Merge suggestions */}
      {activeSuggestions.length > 0 && (
        <div className={styles.suggestions}>
          {activeSuggestions.map((s) => {
            const source = proposalById[s.sourceId];
            const target = proposalById[s.targetId];
            if (!source || !target) return null;
            return (
              <div key={`${s.sourceId}-${s.targetId}`} className={styles.pair}>
                <div className={styles.similarityRow}>
                  <Sparkles size={13} aria-hidden />
                  {t('deliberation.merge.similar', 'Looks {pct}% similar', { pct: Math.round(s.similarity * 100) })}
                </div>
                <div className={styles.pairProposal}>
                  <AuthorTag authorKey={target.author} t={t} currentUserKey={currentUserKey} />
                  <p className={styles.pairText}>{target.text}</p>
                </div>
                <div className={styles.pairConnector} aria-hidden>
                  <GitMerge size={14} />
                </div>
                <div className={styles.pairProposal}>
                  <AuthorTag authorKey={source.author} t={t} currentUserKey={currentUserKey} />
                  <p className={styles.pairText}>{source.text}</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  fullWidth
                  leftIcon={<GitMerge size={14} />}
                  onClick={() => doMerge(s.sourceId, s.targetId)}
                >
                  {t('deliberation.merge.combine', 'Combine into one proposal')}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* All proposals + expert review */}
      <p className={styles.sectionHint}>{t('deliberation.merge.allProposals', 'All proposals')}</p>
      {visibleProposals.length === 0 ? (
        <EmptyState
          icon={<GitMerge size={36} />}
          title={t('deliberation.merge.emptyTitle', 'No proposals yet')}
          compact
        />
      ) : (
        <div className={styles.list}>
          {visibleProposals.map((p) => {
            const review = reviewByProposal[p.id];
            const absorbed = MERGE_SUGGESTIONS.filter((s) => s.targetId === p.id && merged[s.sourceId]);
            const credited = coAuthors[p.id] ?? [];
            const isExpanded = !!expanded[p.id];
            return (
              <div key={p.id} className={styles.proposal}>
                <AuthorTag authorKey={p.author} t={t} currentUserKey={currentUserKey} />
                <p className={styles.proposalText}>{p.text}</p>

                {(absorbed.length > 0 || credited.length > 0) && (
                  <div className={styles.absorbed}>
                    <Check size={12} aria-hidden />
                    {t('deliberation.merge.absorbed', '{n} idea(s) merged in', { n: absorbed.length })}
                    {credited.map((k) => {
                      const cp = deliberationParticipant(k);
                      return (
                        <span key={k} className={styles.absorbedAuthor}>
                          {cp.country && <CountryFlag code={cp.country} size="sm" />}
                          {cp.name.split(' ')[0]}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className={styles.proposalFooter}>
                  {review ? (
                    <>
                      <Badge tone="success" size="sm">
                        <Award size={11} aria-hidden /> {t('deliberation.merge.reviewed', 'Expert reviewed')}
                      </Badge>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded
                          ? t('deliberation.merge.hideReview', 'Hide review')
                          : t('deliberation.merge.readReview', 'Read review')}
                      </button>
                    </>
                  ) : requested[p.id] ? (
                    <Badge tone="warning" size="sm" dot>
                      {t('deliberation.merge.reviewRequested', 'Expert review requested')}
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      className={styles.requestBtn}
                      onClick={() => setRequested((prev) => ({ ...prev, [p.id]: true }))}
                    >
                      <Award size={13} aria-hidden /> {t('deliberation.merge.requestReview', 'Request expert review')}
                    </button>
                  )}
                </div>

                {review && isExpanded && <ExpertReviewBlock review={review} t={t} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProposalMergePanel;
