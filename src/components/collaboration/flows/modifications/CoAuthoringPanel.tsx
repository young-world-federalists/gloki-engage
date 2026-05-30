import React, { useMemo, useState } from 'react';
import { PenLine, Check, X, Heart, Users } from 'lucide-react';
import { Badge, Banner, Button, Modal, CountryFlag, EmptyState } from '../../../shared';
import { useAppSelector } from '../../../../store/hooks';
import { useT, type TFunction } from '../../../../i18n';
import {
  PROBLEM_STATEMENT,
  EDIT_SUGGESTIONS,
  CO_AUTHORS,
  deliberationParticipant,
  relativeTimeKey,
  diffWords,
  type EditSuggestion,
} from '../../../../services/demo/fixtures/deliberation';
import styles from './CoAuthoringPanel.module.scss';

type Field = 'title' | 'description';

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
  const [field, setField] = useState<Field>('description');
  const [text, setText] = useState(current.description);
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
            leftIcon={<PenLine size={15} />}
            onClick={() => onSubmit(field, text.trim(), rationale.trim())}
          >
            {t('deliberation.coauthor.submit', 'Propose change')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.fieldChoice} role="radiogroup" aria-label={t('deliberation.coauthor.whichField', 'Which part to edit')}>
          {(['title', 'description'] as Field[]).map((f) => (
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
                : t('deliberation.coauthor.field.description', 'Description')}
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

const SuggestionCard: React.FC<{
  t: TFunction;
  suggestion: EditSuggestion;
  currentText: string;
  currentUserKey: string;
  hearted: boolean;
  onHeart: () => void;
  onAccept: () => void;
  onReject: () => void;
}> = ({ t, suggestion, currentText, currentUserKey, hearted, onHeart, onAccept, onReject }) => {
  const isMine = suggestion.author === currentUserKey;
  const person = deliberationParticipant(suggestion.author);
  const name = isMine ? t('deliberation.you', 'You') : person.name;
  const rt = relativeTimeKey(suggestion.minutesAgo);
  const heartCount = suggestion.hearts + (hearted ? 1 : 0);

  return (
    <div className={styles.suggestion}>
      <div className={styles.suggestionHead}>
        <span className={styles.avatar} aria-hidden>{person.initials}</span>
        <span className={styles.authorName}>
          {name}
          {person.country && <CountryFlag code={person.country} size="sm" />}
        </span>
        <Badge tone="neutral" size="sm">
          {suggestion.field === 'title'
            ? t('deliberation.coauthor.field.title', 'Title')
            : t('deliberation.coauthor.field.description', 'Description')}
        </Badge>
        <span className={styles.timestamp}>{t(rt.key, rt.def, rt.vars)}</span>
      </div>

      <TrackChanges before={suggestion.baseText !== currentText ? suggestion.baseText : currentText} after={suggestion.suggestedText} />

      {suggestion.rationale && <p className={styles.rationale}>{suggestion.rationale}</p>}

      <div className={styles.suggestionActions}>
        <button
          type="button"
          className={`${styles.heartBtn} ${hearted ? styles.heartActive : ''}`}
          onClick={onHeart}
          aria-pressed={hearted}
          aria-label={t('deliberation.coauthor.support', 'Support this edit')}
        >
          <Heart size={14} fill={hearted ? 'currentColor' : 'none'} aria-hidden />
          <span>{heartCount}</span>
        </button>
        <div className={styles.decideGroup}>
          <Button size="sm" variant="primary" leftIcon={<Check size={14} />} onClick={onAccept}>
            {t('deliberation.coauthor.accept', 'Accept')}
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<X size={14} />} onClick={onReject}>
            {t('deliberation.coauthor.reject', 'Decline')}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * C2 — Track-changes co-authoring of the initiative's problem statement.
 * Anyone can suggest an edit; the author accepts or declines; accepted edits
 * fold into the text and credit the contributor as a co-author. UI-only.
 */
const CoAuthoringPanel: React.FC = () => {
  const t = useT();
  const currentUserKey = useAppSelector((s) => s.user.publicKey) || 'me';

  const [current, setCurrent] = useState<Record<Field, string>>({
    title: PROBLEM_STATEMENT.title,
    description: PROBLEM_STATEMENT.description,
  });
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>(() => [...EDIT_SUGGESTIONS]);
  const [coAuthors, setCoAuthors] = useState<string[]>(() => [...CO_AUTHORS]);
  const [hearted, setHearted] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  const open = suggestions.filter((s) => s.status === 'open');
  const resolved = suggestions.filter((s) => s.status !== 'open');

  const setStatus = (id: string, status: EditSuggestion['status']) =>
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

  const accept = (s: EditSuggestion) => {
    setCurrent((prev) => ({ ...prev, [s.field]: s.suggestedText }));
    setCoAuthors((prev) => (prev.includes(s.author) ? prev : [...prev, s.author]));
    setStatus(s.id, 'accepted');
  };

  const submitSuggestion = (field: Field, text: string, rationale: string) => {
    setSuggestions((prev) => [
      {
        id: `local-${prev.length}`,
        field,
        author: currentUserKey,
        baseText: current[field],
        suggestedText: text,
        rationale,
        hearts: 0,
        status: 'open',
        minutesAgo: 0,
      },
      ...prev,
    ]);
    setShowModal(false);
  };

  const creditNames = coAuthors.filter((k) => k !== currentUserKey);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <PenLine size={16} aria-hidden /> {t('deliberation.coauthor.heading', 'Co-author the statement')}
        </h3>
        <Button size="sm" variant="secondary" leftIcon={<PenLine size={14} />} onClick={() => setShowModal(true)}>
          {t('deliberation.coauthor.suggest', 'Suggest an edit')}
        </Button>
      </div>

      {/* Current statement */}
      <div className={styles.statement}>
        <div className={styles.statementTitleRow}>
          <h4 className={styles.statementTitle}>{current.title}</h4>
          <Badge tone="info" size="sm">{t('deliberation.coauthor.youStarted', 'You started this')}</Badge>
        </div>
        <p className={styles.statementBody}>{current.description}</p>
        {creditNames.length > 0 && (
          <div className={styles.credit}>
            <Users size={13} aria-hidden />
            <span>{t('deliberation.coauthor.coauthored', 'Co-authored with')}</span>
            {creditNames.map((k) => {
              const p = deliberationParticipant(k);
              return (
                <span key={k} className={styles.creditName}>
                  {p.country && <CountryFlag code={p.country} size="sm" />}
                  {p.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Open suggestions */}
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
            {t('deliberation.coauthor.openHint', '{n} suggested edits awaiting your decision', { n: open.length })}
          </p>
          {open.map((s) => (
            <SuggestionCard
              key={s.id}
              t={t}
              suggestion={s}
              currentText={current[s.field]}
              currentUserKey={currentUserKey}
              hearted={!!hearted[s.id]}
              onHeart={() => setHearted((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
              onAccept={() => accept(s)}
              onReject={() => setStatus(s.id, 'rejected')}
            />
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className={styles.resolved}>
          <p className={styles.sectionHint}>{t('deliberation.coauthor.resolved', 'Resolved')}</p>
          {resolved.map((s) => {
            const p = deliberationParticipant(s.author);
            const accepted = s.status === 'accepted';
            return (
              <Banner
                key={s.id}
                tone={accepted ? 'success' : 'info'}
                icon={accepted ? <Check size={16} /> : <X size={16} />}
              >
                {accepted
                  ? t('deliberation.coauthor.acceptedNote', "{name}'s edit was folded in — they're now a co-author.", { name: p.name })
                  : t('deliberation.coauthor.declinedNote', "{name}'s edit was declined, with thanks.", { name: p.name })}
              </Banner>
            );
          })}
        </div>
      )}

      {showModal && (
        <SuggestEditModal t={t} current={current} onClose={() => setShowModal(false)} onSubmit={submitSuggestion} />
      )}
    </div>
  );
};

export default CoAuthoringPanel;
