import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, MessageCircle, Plus } from 'lucide-react';
import ErrorBoundary from '../../shared/ErrorBoundary';
import ProblemVoteFlow from '../../collaboration/flows/voting/ProblemVoteFlow';
import StageGate from '../../community/StageGate';
import { Banner, Button, Modal, SearchableSelect } from '../../shared';
import { useT } from '../../../i18n';
import type { TFunction } from '../../../i18n';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCollaborations } from '../../../store/slices/communitiesSlice';
import { sanitizeExternalUrl } from '../../../utils/urlSafety';
import { COUNTRIES } from '../../../utils/countries';
import { SDG_OPTIONS, type SdgTag } from '../../../services/demo/fixtures/problems';
import { proposeCandidateIssue } from '../../stages/ProblemStage.demo';
import styles from './ProblemEngage.module.scss';

export interface ProblemEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — needed to post a proposed framing + gate participation. */
  communityId: string;
  /** Active community member count, for threshold math. */
  communityMemberCount: number;
  /** Live "second" upvote count (read by the parent), for the threshold hint. */
  up: number;
  /** Host coordinates for the "Discuss this" deep link. */
  hostServer: string;
  hostAgent: string;
}

/**
 * The Problem stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard`. Carries only the quick action — the up/down "second"
 * ({@link ProblemVoteFlow}, gated by the community's trust rule via
 * {@link StageGate}) — plus a plain-language threshold line and two secondary
 * actions: **Discuss this** and **Propose a different framing**. The read chrome
 * (statement, countries, sources) is owned by the card shell now, so the framing
 * banner and "why this matters" voices list are gone (spec §2/§3).
 */
const ProblemEngage: React.FC<ProblemEngageProps> = ({
  initiativeId,
  communityId,
  communityMemberCount,
  up,
  hostServer,
  hostAgent,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const [proposeOpen, setProposeOpen] = useState(false);

  // Mirror ProblemVoteFlow's 50%-of-members rule, surfaced in plain language.
  const needed = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const thresholdMet = up >= needed;
  const remaining = Math.max(needed - up, 0);

  const openDiscussion = () =>
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}/discussion`,
    );

  return (
    <div className={styles.engage}>
      <p className={styles.thresholdHint}>
        {thresholdMet
          ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
          : t(
              'problems.thresholdHint',
              'It becomes a shared problem once {needed} of {members} members agree — {remaining} more to go.',
              { needed, members: communityMemberCount, remaining },
            )}
      </p>

      <StageGate communityId={communityId} stage="problem">
        <ErrorBoundary fallbackMessage={t('problems.voteError', 'Voting encountered an error.')}>
          <ProblemVoteFlow
            instanceId={`${initiativeId}_problem_vote`}
            description=""
            evidenceLinks={[]}
            countries={[]}
            communityMemberCount={communityMemberCount}
            parentContractId={initiativeId}
            stageKey="problemVoteContractId"
          />
        </ErrorBoundary>
      </StageGate>

      <div className={styles.actions}>
        <button type="button" className={styles.textAction} onClick={openDiscussion}>
          <MessageCircle size={14} aria-hidden />
          <span>{t('card.discussThis', 'Discuss this')}</span>
        </button>
        <button type="button" className={styles.textAction} onClick={() => setProposeOpen(true)}>
          <Plus size={14} aria-hidden />
          <span>{t('problems.proposeFramingCta', 'Propose a different framing')}</span>
        </button>
      </div>

      <ProposeIssueModal
        isOpen={proposeOpen}
        onClose={() => setProposeOpen(false)}
        communityId={communityId}
        t={t}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Propose an issue — the plain-language framing template. Submitting posts a new
// candidate issue to the slate (UI-only deploy through the mock layer). Moved
// verbatim from ProblemStage; the single-select country picker simplification is
// Unit 5 per spec §5.
// ---------------------------------------------------------------------------

interface ProposeIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string | null;
  t: TFunction;
}

// Single-select country options (spec §5) — built once from the shared country
// list; the flag rides along as the option icon. State stays a string[] holding
// 0-or-1 code so the existing proposeCandidateIssue({ countries }) call is
// unchanged.
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }));

const ProposeIssueModal: React.FC<ProposeIssueModalProps> = ({ isOpen, onClose, communityId, t }) => {
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [whoWhy, setWhoWhy] = useState('');
  const [source, setSource] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSdg, setSelectedSdg] = useState<SdgTag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedTitle, setSubmittedTitle] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setStatement('');
    setWhoWhy('');
    setSource('');
    setSelectedCountries([]);
    setSelectedSdg(null);
    setError(null);
    setSubmittedTitle(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = title.trim().length > 0 && statement.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!communityId || !publicKey) {
      setError(t('problems.proposeNoCommunity', 'Could not find your community to post this to.'));
      return;
    }
    let cleanSource: string | null = null;
    if (source.trim()) {
      cleanSource = sanitizeExternalUrl(source.trim());
      if (!cleanSource) {
        setError(t('problems.proposeBadSource', 'That source link does not look like a valid web address.'));
        return;
      }
    }
    setError(null);
    try {
      proposeCandidateIssue({
        publicKey,
        communityId,
        title: title.trim(),
        description: statement.trim(),
        countries: selectedCountries,
        evidence: cleanSource ? [cleanSource] : [],
        whoWhy: whoWhy.trim() || undefined,
        sdg: selectedSdg ?? undefined,
      });
      // Refresh the feed so the new candidate appears in the slate.
      if (serverUrl) {
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
      }
      setSubmittedTitle(title.trim());
    } catch {
      setError(t('problems.proposeFailed', 'Something went wrong posting your issue. Please try again.'));
    }
  };

  if (submittedTitle) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('problems.proposeDoneTitle', 'Your issue is on the board')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <Button variant="primary" onClick={handleClose}>
            {t('problems.proposeDoneCta', 'See the board')}
          </Button>
        }
      >
        <div className={styles.success}>
          <Globe size={40} aria-hidden className={styles.successIcon} />
          <p className={styles.successTitle}>“{submittedTitle}”</p>
          <p className={styles.successBody}>
            {t(
              'problems.proposeDoneBody',
              'It starts with your second. Share it with others — when half of you agree, it becomes a problem you take on together.',
            )}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('problems.proposeFramingTitle', 'Propose a framing')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {t('problems.proposeSubmit', 'Put it to the group')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.formIntro}>
          {t(
            'problems.proposeFramingIntro',
            'Suggest a different way to frame this problem — others rank framings together.',
          )}
        </p>

        <label className={styles.formField}>
          <span className={styles.formLabel}>{t('problems.fieldTitle', 'Short title')}</span>
          <input
            className={styles.formInput}
            type="text"
            value={title}
            maxLength={70}
            placeholder={t('problems.fieldTitlePlaceholder', 'e.g. Plastic waste on our beaches')}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>{t('problems.fieldStatement', 'The problem, in one sentence')}</span>
          <textarea
            className={styles.formTextarea}
            value={statement}
            rows={3}
            maxLength={280}
            placeholder={t(
              'problems.fieldStatementPlaceholder',
              'What is happening, and who does it hurt?',
            )}
            onChange={(e) => setStatement(e.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>
            {t('problems.fieldWhoWhy', 'Who it affects, and why now')}{' '}
            <span className={styles.optional}>{t('problems.optional', 'optional')}</span>
          </span>
          <textarea
            className={styles.formTextarea}
            value={whoWhy}
            rows={2}
            maxLength={200}
            placeholder={t('problems.fieldWhoWhyPlaceholder', 'e.g. It hits coastal youth hardest, and it’s getting worse.')}
            onChange={(e) => setWhoWhy(e.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>{t('problems.fieldSource', 'A source or link')}</span>
          <input
            className={styles.formInput}
            type="url"
            inputMode="url"
            value={source}
            placeholder="https://"
            onChange={(e) => setSource(e.target.value)}
          />
          {!source.trim() && (
            <span className={styles.sourceNudge}>
              {t('problems.sourceNudge', 'A source isn’t required, but it helps others trust the problem.')}
            </span>
          )}
        </label>

        <div className={styles.formField}>
          <span className={styles.formLabel}>
            {t('problems.fieldCountries', 'Where is it relevant?')}{' '}
            <span className={styles.optional}>{t('problems.optional', 'optional')}</span>
          </span>
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={selectedCountries[0] ?? ''}
            onChange={(code) => setSelectedCountries(code ? [code] : [])}
            placeholder={t('problems.fieldCountriesPlaceholder', 'Select a country')}
          />
        </div>

        <div className={styles.formField}>
          <span className={styles.formLabel}>
            {t('problems.fieldSdg', 'Global goal')}{' '}
            <span className={styles.optional}>{t('problems.optional', 'optional')}</span>
          </span>
          <div className={styles.chipRow} role="group" aria-label={t('problems.fieldSdg', 'Global goal')}>
            {SDG_OPTIONS.map((option) => {
              const selected = selectedSdg?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? `${styles.chip} ${styles.chipSelected}` : styles.chip}
                  aria-pressed={selected}
                  onClick={() => setSelectedSdg(selected ? null : option)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <Banner tone="error" className={styles.formError}>
            {error}
          </Banner>
        )}
      </div>
    </Modal>
  );
};

export default ProblemEngage;
