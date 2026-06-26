import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Reply, Trash2, Heart, MessageSquare, CornerDownRight, ArrowLeft, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useAppSelector } from '../../../../store/hooks';
import { useI18n, useT } from '../../../../i18n';
import { useCommunityTrust } from '../../../../hooks/useCommunityTrust';
import type { TrustState } from '../../../../services/trust';
import { EmptyState, UserIdentity } from '../../../shared';
import * as api from './discussionApi';
import type { Comment } from './discussionApi';
import styles from './ThreadedDiscussion.module.scss';

// Indent levels 0..DEPTH_CAP render inline; at the cap a node with children
// collapses behind "Continue this thread →" (re-roots locally — no route).
const DEPTH_CAP = 3;

type SortMode = 'top' | 'newest';
type CommentNode = Comment & { children: CommentNode[] };
type ProfileMap = Record<string, { firstName?: string; lastName?: string; country?: string }>;

function buildTree(flat: Comment[], sort: SortMode): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  const cmp =
    sort === 'top'
      ? (a: CommentNode, b: CommentNode) => b.likes.length - a.likes.length || a.timestamp - b.timestamp
      : (a: CommentNode, b: CommentNode) => b.timestamp - a.timestamp;
  const sortRec = (nodes: CommentNode[]) => {
    nodes.sort(cmp);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

const formatTime = (ts: number, locale: string) =>
  new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

const displayName = (
  authorKey: string,
  profiles: ProfileMap,
  isOwn: boolean,
  youLabel: string,
): string => {
  if (isOwn) return youLabel;
  const p = profiles[authorKey];
  const full = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '';
  return full || `${authorKey.slice(0, 12)}…`;
};

const Composer: React.FC<{
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}> = ({ placeholder, submitLabel, onSubmit, onCancel, autoFocus }) => {
  const t = useT();
  const [text, setText] = useState('');
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };
  return (
    <div className={styles.composeBox}>
      <textarea
        className={styles.composeTextarea}
        rows={3}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      />
      <div className={styles.composeActions}>
        <button type="button" className={styles.btnSubmit} onClick={submit} disabled={!text.trim()}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </button>
        )}
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  node: CommentNode;
  depth: number;
  currentUserKey: string;
  profiles: ProfileMap;
  trustOf: (pk: string) => TrustState;
  canParticipate: boolean;
  onReply: (parentId: string, text: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onLike: (id: string) => void | Promise<void>;
  onFocus: (id: string) => void;
}> = ({ node, depth, currentUserKey, profiles, trustOf, canParticipate, onReply, onDelete, onLike, onFocus }) => {
  const { t, locale } = useI18n();
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isOwn = node.author === currentUserKey && !node.deleted;
  const name = displayName(node.author, profiles, isOwn, t('deliberation.you', 'You'));
  const likeCount = node.likes.length;
  const liked = node.likes.includes(currentUserKey);
  const atCap = depth >= DEPTH_CAP;
  const hasChildren = node.children.length > 0;

  return (
    <div className={`${styles.commentItem} ${depth > 0 ? styles.nested : ''}`}>
      {depth > 0 && <div className={styles.threadLine} aria-hidden />}
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <UserIdentity
            name={name}
            countryCode={profiles[node.author]?.country}
            trustState={node.deleted ? undefined : trustOf(node.author)}
            size="sm"
          />
          <span className={styles.timestamp}>{formatTime(node.timestamp, locale)}</span>
          {hasChildren && !atCap && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? t('deliberation.thread.expand', 'Expand replies') : t('deliberation.thread.collapse', 'Collapse replies')}
            >
              {collapsed ? <><ChevronRight size={14} aria-hidden /> {node.children.length}</> : <ChevronDown size={14} aria-hidden />}
            </button>
          )}
        </div>

        <p className={styles.commentText}>{node.text}</p>

        {!node.deleted && (
          <div className={styles.commentActions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
              onClick={() => onLike(node.id)}
              aria-pressed={liked}
              aria-label={t('deliberation.thread.like', 'Like')}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} aria-hidden /> {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {canParticipate && (
              <button type="button" className={styles.actionBtn} onClick={() => setReplying((v) => !v)}>
                <Reply size={14} aria-hidden /> {t('deliberation.thread.reply', 'Reply')}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                onClick={() => onDelete(node.id)}
              >
                <Trash2 size={14} aria-hidden /> {t('deliberation.thread.delete', 'Delete')}
              </button>
            )}
          </div>
        )}

        {replying && (
          <Composer
            placeholder={t('deliberation.thread.replyPlaceholder', 'Reply to {name}…', { name })}
            submitLabel={t('deliberation.thread.reply', 'Reply')}
            autoFocus
            onCancel={() => setReplying(false)}
            onSubmit={async (text) => { await onReply(node.id, text); setReplying(false); }}
          />
        )}
      </div>

      {!collapsed && hasChildren && (
        atCap ? (
          <button type="button" className={styles.continueBtn} onClick={() => onFocus(node.id)}>
            <CornerDownRight size={14} aria-hidden /> {t('deliberation.thread.continue', 'Continue this thread ({n}) →', { n: node.children.length })}
          </button>
        ) : (
          <div className={styles.children}>
            {node.children.map((child) => (
              <CommentItem
                key={child.id}
                node={child}
                depth={depth + 1}
                currentUserKey={currentUserKey}
                profiles={profiles}
                trustOf={trustOf}
                canParticipate={canParticipate}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
                onFocus={onFocus}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export interface ThreadedDiscussionProps {
  /** The resolved discussion sub-contract id (caller owns useFlowContract). */
  contractId: string;
  /** When known, drives the verified-shield via per-author trust; omit on the collab surface. */
  communityId?: string;
  /** Whether the current user may post/reply (gated upstream). */
  canParticipate: boolean;
  /** Empty-state body copy. */
  emptyHint?: string;
}

/**
 * One plain Reddit-style threaded chat for a discussion contract: post → reply →
 * heart, Top/Newest sort, indent-to-cap then "Continue this thread →". No
 * categories, no participation gate — discussion is conversation, not a threshold.
 */
const ThreadedDiscussion: React.FC<ThreadedDiscussionProps> = ({ contractId, communityId, canParticipate, emptyHint }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = (useAppSelector((s) => s.communities.profiles) || {}) as ProfileMap;
  const currentUserKey = publicKey || '';
  const trust = useCommunityTrust(communityId);

  const [flat, setFlat] = useState<Comment[]>([]);
  const [sort, setSort] = useState<SortMode>('top');
  const [focusRootId, setFocusRootId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      setFlat(await api.getComments(serverUrl, publicKey, contractId));
    } catch (err) {
      console.error('[ThreadedDiscussion] Failed to fetch comments:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleTopLevel = useCallback(async (text: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addComment(serverUrl, publicKey, contractId, text, null);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleReply = useCallback(async (parentId: string, text: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addComment(serverUrl, publicKey, contractId, text, parentId);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.deleteComment(serverUrl, publicKey, contractId, id);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleLike = useCallback(async (id: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.likeComment(serverUrl, publicKey, contractId, id);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const tree = useMemo(() => buildTree(flat, sort), [flat, sort]);
  const liveCount = useMemo(() => flat.filter((c) => !c.deleted).length, [flat]);
  const visibleRoots = useMemo(() => {
    if (!focusRootId) return tree;
    const find = (nodes: CommentNode[]): CommentNode | null => {
      for (const n of nodes) {
        if (n.id === focusRootId) return n;
        const f = find(n.children);
        if (f) return f;
      }
      return null;
    };
    const focused = find(tree);
    return focused ? [focused] : tree;
  }, [tree, focusRootId]);

  return (
    <div className={styles.container}>
      {canParticipate && (
        <Composer
          placeholder={t('deliberation.thread.addPlaceholder', 'Add to the discussion…')}
          submitLabel={t('deliberation.thread.comment', 'Comment')}
          onSubmit={handleTopLevel}
        />
      )}

      <div className={styles.toolbar}>
        <span className={styles.count}>
          {t(liveCount === 1 ? 'deliberation.thread.count.one' : 'deliberation.thread.count.many',
            liveCount === 1 ? '1 comment' : '{n} comments', { n: liveCount })}
        </span>
        <div className={styles.sortToggle} role="group" aria-label={t('deliberation.thread.sortLabel', 'Sort comments')}>
          <button
            type="button"
            className={sort === 'top' ? styles.sortActive : styles.sortBtn}
            aria-pressed={sort === 'top'}
            onClick={() => setSort('top')}
          >
            {t('deliberation.thread.sortTop', 'Top')}
          </button>
          <button
            type="button"
            className={sort === 'newest' ? styles.sortActive : styles.sortBtn}
            aria-pressed={sort === 'newest'}
            onClick={() => setSort('newest')}
          >
            {t('deliberation.thread.sortNewest', 'Newest')}
          </button>
        </div>
      </div>

      {focusRootId && (
        <button type="button" className={styles.backBtn} onClick={() => setFocusRootId(null)}>
          <ArrowLeft size={14} aria-hidden /> {t('deliberation.thread.back', 'Back to full discussion')}
        </button>
      )}

      {visibleRoots.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageSquare size={28} aria-hidden />}
          title={t('deliberation.thread.emptyTitle', 'No comments yet')}
          message={emptyHint || t('deliberation.thread.empty', 'Start the conversation about this problem.')}
        />
      ) : (
        <div className={styles.commentList}>
          {visibleRoots.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              currentUserKey={currentUserKey}
              profiles={profiles}
              trustOf={trust.trustOf}
              canParticipate={canParticipate}
              onReply={handleReply}
              onDelete={handleDelete}
              onLike={handleLike}
              onFocus={setFocusRootId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadedDiscussion;
