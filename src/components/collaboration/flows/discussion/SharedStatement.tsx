import React, { useMemo, useState } from 'react';
import { PenLine, Users, Check, ThumbsUp, Eye, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, Banner, Button, Modal, EmptyState } from '../../../shared';
import UserIdentity from '../../../shared/UserIdentity';
import { displayNameFor } from '../../../../utils/displayName';
import { useAppSelector } from '../../../../store/hooks';
import { useT, type TFunction } from '../../../../i18n';
import { useCommunityTrust } from '../../../../hooks/useCommunityTrust';
import type { TrustState } from '../../../../services/trust';
import { diffWords } from '../../../../services/demo/fixtures/deliberation';
import { relativeTimeKey } from '../../../../utils/formatTimeAgo';
import * as api from './discussionApi';
import type { Statement, EditSuggestion } from './discussionApi';
import styles from './SharedStatement.module.scss';

type Field = 'title' | 'body';

/** Inline track-changes view of an edit (deletions struck, additions underlined). */
const TrackChanges: React.FC<{ before: string; after: string }> = ({ before, after }) => {
  const tokens = useMemo(() => diffWords(before, after), [before, after]);
  return (
    <p className={styles.diff}>
      {tokens.map((tok, i) => {
        if (tok.type === 'same') return <span key={i}>{tok.value}</span>;
        if (tok.type === 'add') return <ins key={i} className={styles.add}>{tok.value}</ins>;
        return <del key={i} className={styles.del}>{tok.value}</del>;
      })}
    </p>
  );
};

const SuggestEditModal: React.FC<{
  t: TFunction;
  current: Record<Field, string>;
  onClose: () => void;
  onSubmit: (field: Field, text: string, rationale: string) => void;
}> = ({ t, current, onClose, onSubmit }) => {
  const [field, setField] = useState<Field>('body');
  const [text, setText] = useState(current.body);
  const [rationale, setRationale] = useState('');

  const switchField = (f: Field) => {
    setField(f);
    setText(current[f]);
  };

  const canSubmit = text.trim().length > 0 && text.trim() !== current[field].trim();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('deliberation.coauthor.suggestTitle', 'Suggest an edit')}
      closeLabel={t('deliberation.action.close', 'Close')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('deliberation.action.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            leftIcon={<PenLine size={16} />}
            onClick={() => onSubmit(field, text.trim(), rationale.trim())}
          >
            {t('deliberation.coauthor.submit', 'Propose change')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.fieldChoice} role="radiogroup" aria-label={t('deliberation.coauthor.whichField', 'Which part to edit')}>
          {(['title', 'body'] as Field[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={field === f}
              className={`${styles.fieldOption} ${field === f ? styles.fieldOptionActive : ''}`}
              onClick={() => switchField(f)}
            >
              {f === 'title'
                ? t('deliberation.coauthor.field.title', 'Title')
                : t('deliberation.coauthor.field.body', 'Statement')}
            </button>
          ))}
        </div>

        <label className={styles.formLabel} htmlFor="coauthor-text">
          {t('deliberation.coauthor.proposedText', 'Your proposed wording')}
        </label>
        <textarea
          id="coauthor-text"
          className={styles.textarea}
          rows={field === 'title' ? 2 : 4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className={styles.formLabel} htmlFor="coauthor-why">
          {t('deliberation.coauthor.why', 'Why this change? (optional)')}
        </label>
        <textarea
          id="coauthor-why"
          className={styles.textarea}
          rows={2}
          value={rationale}
          placeholder={t('deliberation.coauthor.whyPlaceholder', 'Help others understand your reasoning…')}
          onChange={(e) => setRationale(e.target.value)}
        />

        {canSubmit && (
          <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>{t('deliberation.coauthor.preview', 'Preview of your change')}</span>
            <TrackChanges before={current[field]} after={text} />
          </div>
        )}
      </div>
    </Modal>
  );
};

type ProfileMap = Record<string, { firstName?: string; lastName?: string; country?: string; displayName?: string }>;

/** One open edit — track-changes diff + a 1p1v support bar toward fold-in. */
const EditCard: React.FC<{
  t: TFunction;
  edit: EditSuggestion;
  target: number;
  currentUserKey: string;
  canParticipate: boolean;
  onToggleSupport: (edit: EditSuggestion) => void;
  profiles: ProfileMap;
  trustOf: (pk: string) => TrustState;
  nameOf: (key: string) => string;
}> = ({ t, edit, target, currentUserKey, canParticipate, onToggleSupport, profiles, trustOf, nameOf }) => {
  const rt = relativeTimeKey(edit.createdAgo);
  const count = edit.supporters.length;
  const mine = edit.supporters.includes(currentUserKey);
  const pct = Math.min(100, Math.round((count / Math.max(1, target)) * 100));

  return (
    <div className={styles.suggestion}>
      <div className={styles.suggestionHead}>
        <UserIdentity
          name={nameOf(edit.author)}
          countryCode={profiles[edit.author]?.country}
          trustState={trustOf(edit.author)}
          size="sm"
        />
        <Badge tone="neutral" size="sm">
          {edit.field === 'title'
            ? t('deliberation.coauthor.field.title', 'Title')
            : t('deliberation.coauthor.field.body', 'Statement')}
        </Badge>
        <span className={styles.timestamp}>{t(rt.key, rt.def, rt.vars)}</span>
      </div>

      <TrackChanges before={edit.baseText} after={edit.text} />
      {edit.rationale && <p className={styles.rationale}>{edit.rationale}</p>}

      {/* 1p1v support toward the fold-in target */}
      <div className={styles.supportRow}>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-label={t('deliberation.coauthor.supportProgress', '{count} of {target} supporters needed to fold in', { count, target })}
        >
          <span className={`${styles.barFill} ${count >= target ? styles.barFillFull : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.supportCount}>
          {t('deliberation.coauthor.supportCount', '{count} / {target}', { count, target })}
        </span>
        {canParticipate && (
          <button
            type="button"
            className={`${styles.supportBtn} ${mine ? styles.supportBtnActive : ''}`}
            onClick={() => onToggleSupport(edit)}
            aria-pressed={mine}
          >
            <ThumbsUp size={16} fill={mine ? 'currentColor' : 'none'} aria-hidden />
            {mine ? t('deliberation.coauthor.supporting', 'Supporting') : t('deliberation.coauthor.support', 'Support')}
          </button>
        )}
      </div>
    </div>
  );
};

export interface SharedStatementProps {
  contractId: string | null;
  statement: Statement;
  edits: EditSuggestion[];
  /** Distinct participants — drives the fold-in target (a majority, floor 3). */
  participantCount: number;
  /** Whether the current user may act at this stage (StageGate predicate). */
  canParticipate: boolean;
  /** Re-read the seam after a write. */
  onChanged: () => void | Promise<void>;
  /** Optional anchored-discussion-on-the-statement, injected by the view (A3). */
  discussionSlot?: React.ReactNode;
  /** Drives the verified-member shield via community trust lookup. */
  communityId?: string;
}

/**
 * The hero of the co-authoring space: the community's co-owned problem
 * statement, plus the open track-changes edits that reshape it. Editing folds
 * in by community vote (1p1v) at a shared target — no single owner/gatekeeper —
 * and credits contributors as co-authors. Seam-backed; supersedes the
 * fixture-local CoAuthoringPanel.
 */
const SharedStatement: React.FC<SharedStatementProps> = ({
  contractId,
  statement,
  edits,
  participantCount,
  canParticipate,
  onChanged,
  discussionSlot,
  communityId,
}) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const currentUserKey = publicKey || 'me';
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const trust = useCommunityTrust(communityId);
  const nameOf = (key: string) => {
    if (key === currentUserKey) return t('deliberation.you', 'You');
    return displayNameFor(profiles[key], key);
  };
  const [showModal, setShowModal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);

  // Fold-in target: a majority of those who've taken part, floor 3.
  const target = Math.max(3, Math.ceil(participantCount / 2));

  const open = edits.filter((e) => e.status === 'open');
  const resolved = edits.filter((e) => e.status !== 'open');
  const creditNames = statement.coAuthors.filter((k) => k !== currentUserKey);

  const toggleSupport = async (edit: EditSuggestion) => {
    if (!serverUrl || !publicKey || !contractId) return;
    if (edit.supporters.includes(currentUserKey)) {
      await api.withdrawEditSupport(serverUrl, publicKey, contractId, edit.id);
    } else {
      await api.supportEdit(serverUrl, publicKey, contractId, edit.id, target);
    }
    await onChanged();
  };

  const submitSuggestion = async (field: Field, text: string, rationale: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.suggestEdit(serverUrl, publicKey, contractId, field, text, rationale);
    setShowModal(false);
    await onChanged();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Users size={16} aria-hidden /> {t('deliberation.coauthor.heading', 'Our shared statement')}
        </h2>
        {canParticipate && (
          /* The stage's primary contribution action — you co-author by suggesting
             an edit (supporting an existing edit is the inline, per-card secondary
             action). Promoted to a primary/md button in Wave 5a. */
          <Button size="md" variant="primary" leftIcon={<PenLine size={16} />} onClick={() => setShowModal(true)}>
            {t('deliberation.coauthor.suggest', 'Suggest an edit')}
          </Button>
        )}
      </div>

      {/* The co-owned statement */}
      <div className={styles.statement}>
        <div className={styles.statementTitleRow}>
          <h3 className={styles.statementTitle}>{statement.title}</h3>
          <Badge tone="info" size="sm">{t('deliberation.coauthor.coOwned', 'Co-owned')}</Badge>
        </div>
        <p className={styles.statementBody}>{statement.body}</p>
        {creditNames.length > 0 && (
          <div className={styles.credit}>
            <Users size={13} aria-hidden />
            <span>{t('deliberation.coauthor.coauthored', 'Co-authored with')}</span>
            {creditNames.map((k) => (
              <span key={k} className={styles.creditName}>
                <UserIdentity
                  name={nameOf(k)}
                  countryCode={profiles[k]?.country}
                  trustState={trust.trustOf(k)}
                  size="sm"
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {discussionSlot && (
        <div className={styles.statementDiscussion}>
          <button
            type="button"
            className={styles.discussToggle}
            onClick={() => setShowDiscussion((v) => !v)}
            aria-expanded={showDiscussion}
          >
            <MessageCircle size={16} aria-hidden /> {t('deliberation.coauthor.discuss', 'Discuss the statement')}
            {showDiscussion ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
          </button>
          {showDiscussion && <div className={styles.statementThread}>{discussionSlot}</div>}
        </div>
      )}

      {/* Open edits */}
      {open.length === 0 ? (
        <EmptyState
          icon={<PenLine size={36} />}
          title={t('deliberation.coauthor.emptyTitle', 'No open edits')}
          message={t('deliberation.coauthor.emptyMessage', 'Suggest a change to sharpen this statement together.')}
          compact
        />
      ) : (
        <div className={styles.list}>
          <p className={styles.sectionHint}>
            {open.length === 1
              ? t('deliberation.coauthor.openHintOne', '1 open edit · folds in at {target} supporters', { target })
              : t('deliberation.coauthor.openHint', '{n} open edits · folds in at {target} supporters', { n: open.length, target })}
          </p>
          {open.map((e) => (
            <EditCard
              key={e.id}
              t={t}
              edit={e}
              target={target}
              currentUserKey={currentUserKey}
              canParticipate={canParticipate}
              onToggleSupport={toggleSupport}
              profiles={profiles}
              trustOf={trust.trustOf}
              nameOf={nameOf}
            />
          ))}
        </div>
      )}

      {!canParticipate && (
        <p className={styles.viewOnly}>
          <Eye size={13} aria-hidden /> {t('deliberation.coauthor.viewOnly', 'Viewing only — verified members can co-author the statement.')}
        </p>
      )}

      {/* Resolved edits */}
      {resolved.length > 0 && (
        <div className={styles.resolved}>
          <p className={styles.sectionHint}>{t('deliberation.coauthor.resolved', 'Resolved')}</p>
          {resolved.map((e) => {
            const accepted = e.status === 'accepted';
            return (
              <Banner
                key={e.id}
                tone={accepted ? 'success' : 'info'}
                icon={accepted ? <Check size={16} /> : <PenLine size={16} />}
              >
                {accepted
                  ? t('deliberation.coauthor.acceptedNote', "{name}'s edit folded in — they're now a co-author.", { name: nameOf(e.author) })
                  : t('deliberation.coauthor.staleNote', "{name}'s edit was superseded by another change — it can be re-proposed.", { name: nameOf(e.author) })}
              </Banner>
            );
          })}
        </div>
      )}

      {showModal && (
        <SuggestEditModal
          t={t}
          current={{ title: statement.title, body: statement.body }}
          onClose={() => setShowModal(false)}
          onSubmit={submitSuggestion}
        />
      )}
    </div>
  );
};

export default SharedStatement;
