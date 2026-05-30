import React, { useCallback, useMemo, useState } from 'react';
import {
  MessageCircle,
  Reply,
  Heart,
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
import {
  DISCUSSION_COMMENTS,
  DELIBERATION_PARTICIPANTS,
  PRESENCE_NOW,
  PRESENCE_TICKER,
  deliberationParticipant,
  relativeTimeKey,
  type DeliberationComment,
  type DeliberationCategory,
} from '../../../../services/demo/fixtures/deliberation';
import CoPresenceBar from './CoPresenceBar';
import styles from './DeliberationThread.module.scss';

// ---------------------------------------------------------------------------
// Category configuration — colour identity comes from semantic Badge tones, so
// there are no ad-hoc colours here.
// ---------------------------------------------------------------------------
interface CategoryMeta {
  key: DeliberationCategory;
  labelKey: string;
  labelDefault: string;
  icon: React.ElementType;
  tone: BadgeTone;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'evidence', labelKey: 'deliberation.category.evidence', labelDefault: 'Evidence', icon: Search, tone: 'info' },
  { key: 'impact', labelKey: 'deliberation.category.impact', labelDefault: 'Impact', icon: Globe, tone: 'warning' },
  { key: 'solutions', labelKey: 'deliberation.category.solutions', labelDefault: 'Solutions', icon: Lightbulb, tone: 'success' },
  { key: 'concerns', labelKey: 'deliberation.category.concerns', labelDefault: 'Concerns', icon: AlertTriangle, tone: 'error' },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<DeliberationCategory, CategoryMeta>;

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------
type CommentNode = DeliberationComment & { children: CommentNode[] };

function buildTree(flat: DeliberationComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  // Top level newest-first (lower minutesAgo = more recent); replies oldest-first.
  roots.sort((a, b) => a.minutesAgo - b.minutesAgo);
  const sortReplies = (nodes: CommentNode[]) => {
    nodes.forEach((n) => {
      n.children.sort((a, b) => b.minutesAgo - a.minutesAgo);
      sortReplies(n.children);
    });
  };
  sortReplies(roots);
  return roots;
}

const CategoryLabel: React.FC<{ category: DeliberationCategory; t: TFunction }> = ({ category, t }) => {
  const cfg = CATEGORY_MAP[category];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Badge tone={cfg.tone} size="sm">
      <Icon size={11} aria-hidden /> {t(cfg.labelKey, cfg.labelDefault)}
    </Badge>
  );
};

// ---------------------------------------------------------------------------
// Compose box
// ---------------------------------------------------------------------------
const ComposeBox: React.FC<{
  t: TFunction;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string, category: DeliberationCategory) => void;
  onCancel?: () => void;
  initialCategory?: DeliberationCategory;
  showCategories?: boolean;
  autoFocus?: boolean;
}> = ({ t, placeholder, submitLabel, onSubmit, onCancel, initialCategory = 'evidence', showCategories, autoFocus }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<DeliberationCategory>(initialCategory);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, category);
    setText('');
  };

  return (
    <div className={styles.composeBox}>
      {showCategories && (
        <div className={styles.categorySelector} role="group" aria-label={t('deliberation.category.choose', 'Choose a category')}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`${styles.categoryChip} ${active ? styles.categoryChipActive : ''}`}
                aria-pressed={active}
                onClick={() => setCategory(cat.key)}
              >
                <Icon size={13} aria-hidden /> {t(cat.labelKey, cat.labelDefault)}
              </button>
            );
          })}
        </div>
      )}
      <textarea
        className={styles.textarea}
        rows={3}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      />
      <div className={styles.composeActions}>
        <button type="button" className={styles.btnSubmit} onClick={submit} disabled={!text.trim()}>
          <Send size={14} aria-hidden /> {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={styles.btnGhost} onClick={onCancel}>
            {t('deliberation.action.cancel', 'Cancel')}
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Single comment (recursive)
// ---------------------------------------------------------------------------
const CommentItem: React.FC<{
  node: CommentNode;
  depth: number;
  t: TFunction;
  currentUserKey: string;
  hearted: Record<string, boolean>;
  onToggleHeart: (id: string) => void;
  onReply: (parentId: string, text: string, category: DeliberationCategory) => void;
}> = ({ node, depth, t, currentUserKey, hearted, onToggleHeart, onReply }) => {
  const [replying, setReplying] = useState(false);
  const isMine = node.author === currentUserKey;
  const person = deliberationParticipant(node.author);
  const name = isMine ? t('deliberation.you', 'You') : person.name;
  const rt = relativeTimeKey(node.minutesAgo);
  const isHearted = !!hearted[node.id];
  const heartCount = node.hearts + (isHearted ? 1 : 0);

  return (
    <div className={`${styles.comment} ${depth > 0 ? styles.nested : ''}`}>
      {depth > 0 && <span className={styles.threadLine} aria-hidden />}
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={`${styles.avatar} ${isMine ? styles.avatarMe : ''}`} aria-hidden>
            {person.initials}
          </span>
          <span className={styles.authorName}>
            {name}
            {person.country && <CountryFlag code={person.country} size="sm" />}
          </span>
          <CategoryLabel category={node.category} t={t} />
          <span className={styles.timestamp}>{t(rt.key, rt.def, rt.vars)}</span>
        </div>

        <p className={styles.commentText}>{node.text}</p>

        <div className={styles.commentActions}>
          <button
            type="button"
            className={`${styles.heartBtn} ${isHearted ? styles.heartActive : ''}`}
            onClick={() => onToggleHeart(node.id)}
            aria-pressed={isHearted}
            aria-label={t('deliberation.action.heart', 'Appreciate this')}
          >
            <Heart size={14} fill={isHearted ? 'currentColor' : 'none'} aria-hidden />
            <span>{heartCount}</span>
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => setReplying((v) => !v)}>
            <Reply size={13} aria-hidden /> {t('deliberation.action.reply', 'Reply')}
          </button>
        </div>

        {replying && (
          <ComposeBox
            t={t}
            placeholder={t('deliberation.reply.placeholder', 'Reply to {name}…', { name: name.split(' ')[0] })}
            submitLabel={t('deliberation.action.reply', 'Reply')}
            initialCategory={node.category}
            autoFocus
            onSubmit={(text) => {
              onReply(node.id, text, node.category);
              setReplying(false);
            }}
            onCancel={() => setReplying(false)}
          />
        )}
      </div>

      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              t={t}
              currentUserKey={currentUserKey}
              hearted={hearted}
              onToggleHeart={onToggleHeart}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface DeliberationThreadProps {
  /** Show the live co-presence bar above the thread (default true). */
  showPresence?: boolean;
}

/**
 * C1 — Threaded, co-present deliberation. Country presence, "hearts," categories,
 * and a live-feeling sense that people from several countries are here together.
 * UI-only: seeded from the deliberation fixture, optimistic local state.
 */
const DeliberationThread: React.FC<DeliberationThreadProps> = ({ showPresence = true }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey) || 'me';

  const [comments, setComments] = useState<DeliberationComment[]>(() => [...DISCUSSION_COMMENTS]);
  const [hearted, setHearted] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<DeliberationCategory | 'all'>('all');

  const toggleHeart = useCallback((id: string) => {
    setHearted((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addComment = useCallback(
    (text: string, category: DeliberationCategory, parentId: string | null) => {
      setComments((prev) => [
        ...prev,
        {
          id: `local-${prev.length}-${parentId ?? 'root'}`,
          author: publicKey,
          category,
          text,
          hearts: 0,
          parentId,
          minutesAgo: 0,
        },
      ]);
    },
    [publicKey],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of comments) counts[c.category] = (counts[c.category] || 0) + 1;
    return counts;
  }, [comments]);

  const filtered = useMemo(() => {
    if (filter === 'all') return comments;
    const matchRoots = new Set(comments.filter((c) => c.category === filter && !c.parentId).map((c) => c.id));
    return comments.filter((c) => {
      let cur: DeliberationComment | undefined = c;
      while (cur) {
        if (matchRoots.has(cur.id)) return true;
        if (!cur.parentId) break;
        cur = comments.find((p) => p.id === cur!.parentId);
      }
      return false;
    });
  }, [comments, filter]);

  const tree = useMemo(() => buildTree(filtered), [filtered]);

  return (
    <div className={styles.container}>
      {showPresence && (
        <CoPresenceBar participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} ticker={PRESENCE_TICKER} />
      )}

      <div className={styles.header}>
        <MessageCircle size={18} aria-hidden />
        <span>{t('deliberation.thread.count', '{n} contributions', { n: comments.length })}</span>
      </div>

      <ComposeBox
        t={t}
        placeholder={t('deliberation.compose.placeholder', 'Share how this looks where you live…')}
        submitLabel={t('deliberation.action.comment', 'Add to the discussion')}
        showCategories
        onSubmit={(text, category) => addComment(text, category, null)}
      />

      <div className={styles.filterBar} role="group" aria-label={t('deliberation.filter.label', 'Filter by category')}>
        <button
          type="button"
          className={`${styles.filterChip} ${filter === 'all' ? styles.filterChipActive : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {t('deliberation.filter.all', 'All')}
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = filter === cat.key;
          const count = categoryCounts[cat.key] || 0;
          return (
            <button
              key={cat.key}
              type="button"
              className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
              aria-pressed={active}
              onClick={() => setFilter(cat.key)}
            >
              <Icon size={13} aria-hidden /> {t(cat.labelKey, cat.labelDefault)}
              {count > 0 && <span className={styles.filterCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {tree.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={40} />}
          title={t('deliberation.empty.title', 'Nothing here yet')}
          message={t('deliberation.empty.message', 'Be the first to share a perspective in this category.')}
          compact
        />
      ) : (
        <div className={styles.list}>
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              t={t}
              currentUserKey={publicKey}
              hearted={hearted}
              onToggleHeart={toggleHeart}
              onReply={(parentId, text, category) => addComment(text, category, parentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliberationThread;
