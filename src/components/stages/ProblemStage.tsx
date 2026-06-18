import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, MessageCircle, ChevronDown, Plus, ExternalLink } from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ProblemVoteFlow from '../collaboration/flows/voting/ProblemVoteFlow';
import { Banner, Badge, Button, Modal, CountryPresence } from '../shared';
import { useT } from '../../i18n';
import type { TFunction } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { getInitiative, resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getTally } from '../collaboration/flows/voting/problemVoteApi';
import { getCountryName, getCountryFlag } from '../../utils/countries';
import { sanitizeExternalUrl } from '../../utils/urlSafety';
import { SDG_OPTIONS, type ProblemFraming, type SdgTag } from '../../services/demo/fixtures/problems';
import { getProblemFraming, proposeCandidateIssue } from './ProblemStage.demo';
import styles from './ProblemStage.module.scss';

export interface ProblemStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Active community member count, for threshold math. */
  communityMemberCount: number;
  /** Evidence URLs from initiative details (dashboard only; feed passes none). */
  evidenceLinks?: string[];
  /** Country codes from initiative details (dashboard only; feed passes none). */
  countries?: string[];
}

interface InitiativeDetails {
  title?: string;
  description?: string;
  countries?: string[];
  evidence?: string[];
}

interface Tally {
  up: number;
  down: number;
  total: number;
}

/** The 4 VftC countries — offered as relevance toggles when proposing an issue. */
const PROPOSE_COUNTRIES = ['KE', 'NG', 'MW', 'CD'];

/** Show a readable host instead of a long raw URL. */
function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Stage 1 — Problem. Owned by Lane B (`src/components/stages/ProblemStage.*`).
 *
 * Frames a candidate issue as the moment a crowd becomes a "we": who it affects
 * across borders, an optional SDG tag and sources, a legible "how close are we"
 * threshold, a celebratory payoff once the community agrees, a light "why this
 * matters" reveal, and a way to propose a different problem. The up/down
 * "second" mechanism itself is Lane D's `ProblemVoteFlow` — wrapped, never
 * edited (evidence/countries suppressed there so the framing above is the single
 * styled source of truth).
 */
const ProblemStage: React.FC<ProblemStageProps> = ({
  initiativeId,
  communityMemberCount,
  evidenceLinks = [],
  countries = [],
}) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityCollaborations = useAppSelector((s) => s.communities.communityCollaborations);
  const params = useParams<{ communityId?: string }>();

  const [details, setDetails] = useState<InitiativeDetails | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [voicesOpen, setVoicesOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);

  // Which community hosts this initiative — needed to post a proposed issue.
  // The feed has it in the collaboration map; the dashboard has it in the route.
  const communityId = useMemo(() => {
    for (const [cid, collabs] of Object.entries(communityCollaborations || {})) {
      if (Array.isArray(collabs) && collabs.some((c) => c.id === initiativeId)) return cid;
    }
    return params.communityId ?? null;
  }, [communityCollaborations, initiativeId, params.communityId]);

  // Read initiative details + the live "second" tally (read-only). Used to frame
  // and to drive the payoff — never to draw a second progress bar (the flow owns
  // that). Degrades silently if reads fail.
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    (async () => {
      try {
        const det = await getInitiative(serverUrl, publicKey, initiativeId);
        if (!cancelled && det) setDetails(det as InitiativeDetails);
      } catch {
        /* details are optional framing — ignore */
      }
      try {
        const sc = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'problemVoteContractId');
        if (sc?.contractId) {
          const tl = await getTally(serverUrl, publicKey, sc.contractId);
          if (!cancelled && tl) setTally(tl as Tally);
        }
      } catch {
        /* tally is optional — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  const framing: ProblemFraming | undefined = useMemo(
    () => getProblemFraming(initiativeId, details?.title),
    [initiativeId, details?.title],
  );

  // Display data: explicit props (dashboard) win, then framing, then live details.
  const displayCountries =
    countries.length > 0 ? countries : framing?.countries ?? details?.countries ?? [];
  const rawSources = evidenceLinks.length > 0 ? evidenceLinks : framing?.evidence ?? details?.evidence ?? [];
  const sources = useMemo(
    () => rawSources.map((u) => sanitizeExternalUrl(u)).filter((u): u is string => u !== null),
    [rawSources],
  );
  const uniqueCountries = useMemo(() => Array.from(new Set(displayCountries)), [displayCountries]);
  const sdg = framing?.sdg;
  const whoWhy = framing?.whoWhy;
  const voices = framing?.voices ?? [];

  // Mirror ProblemVoteFlow's 50%-of-members rule, surfaced in plain language.
  const needed = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const up = tally?.up ?? 0;
  const thresholdMet = tally != null && up >= needed;
  const remaining = Math.max(needed - up, 0);

  const presenceLabel =
    uniqueCountries.length === 1
      ? getCountryName(uniqueCountries[0])
      : t('problems.nCountries', '{n} countries', { n: uniqueCountries.length });

  return (
    <div className={styles.stage}>
      {thresholdMet && (
        <Banner tone="success" icon={<Globe size={18} aria-hidden />} className={styles.payoff}>
          <strong>{t('problems.chosenTogether', 'We chose this together.')}</strong>{' '}
          {t(
            'problems.chosenTogetherBody',
            'Your community agreed this is a shared problem worth taking on.',
          )}
        </Banner>
      )}

      {(uniqueCountries.length > 0 || sdg) && (
        <div className={styles.framing}>
          {uniqueCountries.length > 0 && (
            <CountryPresence countries={uniqueCountries} size="sm" label={presenceLabel} />
          )}
          {sdg && (
            <Badge tone="info" size="sm">
              {t('problems.sdgTag', 'SDG {id} · {label}', { id: sdg.id, label: sdg.label })}
            </Badge>
          )}
        </div>
      )}

      {(framing?.description || details?.description) && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('problems.labelProblem', 'The problem')}</span>
          <p className={styles.statement}>{framing?.description || details?.description}</p>
        </div>
      )}
      {whoWhy && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('problems.labelWho', 'Who it affects')}</span>
          <p className={styles.whoWhy}>{whoWhy}</p>
        </div>
      )}

      {sources.length > 0 && (
        <div className={styles.sources}>
          <span className={styles.sourcesLabel}>{t('problems.sources', 'Sources')}</span>
          <ul>
            {sources.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} aria-hidden /> {prettyHost(url)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.thresholdHint}>
        {thresholdMet
          ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
          : t(
              'problems.thresholdHint',
              'It becomes a shared problem once {needed} of {members} members agree — {remaining} more to go.',
              { needed, members: communityMemberCount, remaining },
            )}
      </p>

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

      {voices.length > 0 && (
        <div className={styles.voices}>
          <button
            type="button"
            className={styles.voicesToggle}
            aria-expanded={voicesOpen}
            onClick={() => setVoicesOpen((v) => !v)}
          >
            <MessageCircle size={14} aria-hidden />
            <span>{t('problems.whyMatters', 'Why this matters to us')}</span>
            <ChevronDown size={14} aria-hidden className={voicesOpen ? styles.chevOpen : undefined} />
          </button>
          {voicesOpen && (
            <ul className={styles.voiceList}>
              {voices.map((v, i) => (
                <li key={i} className={styles.voice}>
                  <span className={styles.voiceFlag} role="img" aria-label={getCountryName(v.country)}>
                    {getCountryFlag(v.country)}
                  </span>
                  <span className={styles.voiceText}>
                    <strong>{v.name}</strong> {v.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="button" className={styles.proposeLink} onClick={() => setProposeOpen(true)}>
        <Plus size={14} aria-hidden />
        <span>{t('problems.proposeFramingCta', 'Propose a different framing')}</span>
      </button>

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
// Propose an issue — the B2 plain-language framing template. Submitting posts a
// new candidate issue to the slate (UI-only deploy through the mock layer).
// ---------------------------------------------------------------------------

interface ProposeIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string | null;
  t: TFunction;
}

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

  const toggleCountry = (code: string) =>
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

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
          <div className={styles.chipRow} role="group" aria-label={t('problems.fieldCountries', 'Where is it relevant?')}>
            {PROPOSE_COUNTRIES.map((code) => {
              const selected = selectedCountries.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  className={selected ? `${styles.chip} ${styles.chipSelected}` : styles.chip}
                  aria-pressed={selected}
                  onClick={() => toggleCountry(code)}
                >
                  <span role="img" aria-hidden>
                    {getCountryFlag(code)}
                  </span>{' '}
                  {getCountryName(code)}
                </button>
              );
            })}
          </div>
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

export default ProblemStage;
