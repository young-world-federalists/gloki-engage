import React, { useMemo, useState } from 'react';
import {
  ThumbsUp,
  MessageCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Globe,
  Lightbulb,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Badge, CountryFlag, EmptyState } from '../../../shared';
import type { BadgeTone } from '../../../shared';
import { useAppSelector } from '../../../../store/hooks';
import { useT, type TFunction } from '../../../../i18n';
import { relativeTimeKey } from '../../../../utils/formatTimeAgo';
import { useAuthorResolver } from './useDiscussionData';
import AnchoredThread from './AnchoredThread';
import * as api from './discussionApi';
import type { Position, AnchoredComment, PositionType } from './discussionApi';
import styles from './PositionsBoard.module.scss';

interface CategoryMeta {
  key: PositionType;
  labelKey: string;
  labelDefault: string;
  icon: React.ElementType;
  tone: BadgeTone;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'evidence', labelKey: 'deliberation.category.evidence', labelDefault: 'Evidence', icon: Search, tone: 'info' },
  { key: 'impact', labelKey: 'deliberation.category.impact', labelDefault: 'Impact', icon: Globe, tone: 'warning' },
  { key: 'solutions', labelKey: 'deliberation.category.solutions', labelDefault: 'Ideas', icon: Lightbulb, tone: 'success' },
  { key: 'concerns', labelKey: 'deliberation.category.concerns', labelDefault: 'Concerns', icon: AlertTriangle, tone: 'error' },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<PositionType, CategoryMeta>;

/** A position counts as prominent (vs "also raised") at this support level. */
const PROMINENT_MIN = 3;

const CategoryLabel: React.FC<{ category: PositionType; t: TFunction }> = ({ category, t }) => {
  const cfg = CATEGORY_MAP[category];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Badge tone={cfg.tone} size="sm">
      <Icon size={11} aria-hidden /> {t(cfg.labelKey, cfg.labelDefault)}
    </Badge>
  );
};

const AddPosition: React.FC<{
  t: TFunction;
  onSubmit: (type: PositionType, text: string) => void;
  onCancel: () => void;
}> = ({ t, onSubmit, onCancel }) => {
  const [type, setType] = useState<PositionType>('solutions');
  const [text, setText] = useState('');
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(type, trimmed);
  };
  return (
    <div className={styles.compose}>
      <div className={styles.typeChips} role="group" aria-label={t('deliberation.category.choose', 'Choose a category')}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = type === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`${styles.typeChip} ${active ? styles.typeChipActive : ''}`}
              aria-pressed={active}
              onClick={() => setType(cat.key)}
            >
              <Icon size={13} aria-hidden /> {t(cat.labelKey, cat.labelDefault)}
            </button>
          );
        })}
      </div>
      <textarea
        className={styles.textarea}
        rows={3}
        autoFocus
        placeholder={t('deliberation.positions.placeholder', 'Where do you stand? Share a position others can support…')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className={styles.composeActions}>
        <button type="button" className={styles.btnSubmit} onClick={submit} disabled={!text.trim()}>
          <Send size={14} aria-hidden /> {t('deliberation.positions.add', 'Add a position')}
        </button>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>
          {t('deliberation.action.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
};

const PositionCard: React.FC<{
  t: TFunction;
  position: Position;
  anchored: AnchoredComment[];
  contractId: string | null;
  canParticipate: boolean;
  currentUserKey: string;
  resolve: ReturnType<typeof useAuthorResolver>;
  onToggleSupport: (p: Position) => void;
  onChanged: () => void | Promise<void>;
}> = ({ t, position, anchored, contractId, canParticipate, currentUserKey, resolve, onToggleSupport, onChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const person = resolve(position.author);
  const name = person.isMine ? t('deliberation.you', 'You') : person.name;
  const rt = relativeTimeKey(position.createdAgo);
  const count = position.supporters.length;
  const mine = position.supporters.includes(currentUserKey);

  return (
    <div className={styles.position}>
      <div className={styles.positionHead}>
        <CategoryLabel category={position.type} t={t} />
        <span className={styles.timestamp}>{t(rt.key, rt.def, rt.vars)}</span>
      </div>

      <p className={styles.positionText}>{position.text}</p>

      <div className={styles.positionFooter}>
        <span className={styles.author}>
          <span className={`${styles.avatar} ${person.isMine ? styles.avatarMe : ''}`} aria-hidden>{person.initials}</span>
          <span className={styles.authorName}>{name}</span>
          {person.country && <CountryFlag code={person.country} size="sm" />}
        </span>

        <div className={styles.positionActions}>
          {canParticipate ? (
            <button
              type="button"
              className={`${styles.supportBtn} ${mine ? styles.supportBtnActive : ''}`}
              onClick={() => onToggleSupport(position)}
              aria-pressed={mine}
              aria-label={t('deliberation.positions.support', 'Support this position')}
            >
              <ThumbsUp size={14} fill={mine ? 'currentColor' : 'none'} aria-hidden />
              <span>{count}</span>
            </button>
          ) : (
            <span
              className={styles.supportStatic}
              aria-label={
                count === 1
                  ? t('deliberation.positions.supporterOne', '1 supporter')
                  : t('deliberation.positions.supporters', '{n} supporters', { n: count })
              }
            >
              <ThumbsUp size={14} aria-hidden /> <span>{count}</span>
            </span>
          )}
          <button
            type="button"
            className={styles.replyToggle}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <MessageCircle size={14} aria-hidden />
            <span>
              {position.replyCount === 1
                ? t('deliberation.positions.replyOne', '1 reply')
                : t('deliberation.positions.replies', '{n} replies', { n: position.replyCount })}
            </span>
            {expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.anchored}>
          <AnchoredThread
            anchor={position.id}
            anchored={anchored}
            contractId={contractId}
            canParticipate={canParticipate}
            onChanged={onChanged}
            placeholder={t('deliberation.positions.replyPlaceholder', 'Reply to this position…')}
          />
        </div>
      )}
    </div>
  );
};

export interface PositionsBoardProps {
  positions: Position[];
  anchored: AnchoredComment[];
  contractId: string | null;
  canParticipate: boolean;
  onChanged: () => void | Promise<void>;
}

/**
 * "Where we stand" — member-raised, country-tagged, typed positions that capture
 * where the community differs. Anyone eligible adds a position; others support
 * it (1p1v); positions rank by support; low-support ones collapse under "also
 * raised". Each opens an anchored discussion. Replaces DeliberationThread.
 */
const PositionsBoard: React.FC<PositionsBoardProps> = ({ positions, anchored, contractId, canParticipate, onChanged }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const currentUserKey = publicKey || 'me';
  const resolve = useAuthorResolver();

  const [adding, setAdding] = useState(false);
  const [showAlso, setShowAlso] = useState(false);

  const sorted = useMemo(
    () => [...positions].sort((a, b) => b.supporters.length - a.supporters.length),
    [positions],
  );
  const isProminent = (p: Position) => p.supporters.length >= PROMINENT_MIN || p.author === currentUserKey;
  const prominent = sorted.filter(isProminent);
  const alsoRaised = sorted.filter((p) => !isProminent(p));

  const addPosition = async (type: PositionType, text: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addPosition(serverUrl, publicKey, contractId, type, text);
    setAdding(false);
    await onChanged();
  };

  const toggleSupport = async (p: Position) => {
    if (!serverUrl || !publicKey || !contractId) return;
    if (p.supporters.includes(currentUserKey)) {
      await api.withdrawPositionSupport(serverUrl, publicKey, contractId, p.id);
    } else {
      await api.supportPosition(serverUrl, publicKey, contractId, p.id);
    }
    await onChanged();
  };

  const renderCard = (p: Position) => (
    <PositionCard
      key={p.id}
      t={t}
      position={p}
      anchored={anchored}
      contractId={contractId}
      canParticipate={canParticipate}
      currentUserKey={currentUserKey}
      resolve={resolve}
      onToggleSupport={toggleSupport}
      onChanged={onChanged}
    />
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <MessageCircle size={16} aria-hidden /> {t('deliberation.positions.heading', 'Where we stand')}
        </h2>
        {canParticipate && !adding && (
          <button type="button" className={styles.addBtn} onClick={() => setAdding(true)}>
            <Plus size={15} aria-hidden /> {t('deliberation.positions.add', 'Add a position')}
          </button>
        )}
      </div>

      {adding && <AddPosition t={t} onSubmit={addPosition} onCancel={() => setAdding(false)} />}

      {positions.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={36} />}
          title={t('deliberation.positions.emptyTitle', 'No positions yet')}
          message={t('deliberation.positions.emptyMessage', 'Add the first position to show where you stand.')}
          compact
        />
      ) : (
        <div className={styles.list}>{prominent.map(renderCard)}</div>
      )}

      {alsoRaised.length > 0 && (
        <div className={styles.alsoRaised}>
          <button
            type="button"
            className={styles.alsoToggle}
            onClick={() => setShowAlso((v) => !v)}
            aria-expanded={showAlso}
          >
            {showAlso ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
            {t('deliberation.positions.alsoRaised', 'Also raised ({n})', { n: alsoRaised.length })}
          </button>
          {showAlso && <div className={styles.list}>{alsoRaised.map(renderCard)}</div>}
        </div>
      )}

      {!canParticipate && (
        <p className={styles.viewOnly}>
          {t('deliberation.positions.viewOnly', 'Viewing only — verified members can add and support positions.')}
        </p>
      )}
    </div>
  );
};

export default PositionsBoard;
