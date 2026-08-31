import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Reply, Trash2, Heart, MessageSquare, CornerDownRight, ArrowLeft, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useAppSelector } from '../../../../store/hooks';
import { useI18n, useT } from '../../../../i18n';
import { useCommunityTrust } from '../../../../hooks/useCommunityTrust';
import type { TrustState } from '../../../../services/trust';
import { EmptyState, SegmentedControl, UserIdentity, SourceLinks, SourcesInput } from '../../../shared';
import { displayNameFor } from '../../../../utils/displayName';
import { formatDateTime } from '../../../../utils/formatDateTime';
import { normalizeSources, type SourceLink } from '../../../../utils/sources';
import * as api from './discussionApi';
import type { Comment } from './discussionApi';
import { useContractSync } from '../shared/useContractSync';
import { isDemoContract } from '../../../../services/demo/demoRegistry';
import styles from './ThreadedDiscussion.module.scss';

// Indent levels 0..DEPTH_CAP render inline; at the cap a node with children
// collapses behind "Continue this thread →" (re-roots locally — no route).
const DEPTH_CAP = 3;

type SortMode = 'top' | 'newest';
type CommentNode = Comment & { children: CommentNode[] };
type ProfileMap = Record<string, { firstName?: string; lastName?: string; country?: string; displayName?: string }>;

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

const displayName = (
  authorKey: string,
  profiles: ProfileMap,
  isOwn: boolean,
  youLabel: string,
): string => {
  if (isOwn) return youLabel;
  return displayNameFor(profiles[authorKey], authorKey);
};

const Composer: React.FC<{
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string, sources: SourceLink[]) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}> = ({ placeholder, submitLabel, onSubmit, onCancel, autoFocus }) => {
  const t = useT();
  const [text, setText] = useState('');
  const [sources, setSources] = useState<SourceLink[]>([{ url: '' }]);
  const [showSources, setShowSources] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // SourcesInput leaves blank rows in place while editing (its own
      // contract: "caller filters on submit") — the untouched default row
      // ({ url: '' }) would otherwise go out on every post that never
      // touches "+ Add sources" at all.
      await onSubmit(trimmed, normalizeSources(sources));
      // Only clear the draft on success — a failed post keeps the text (and
      // sources) in place so nothing typed is silently lost.
      setText('');
      setSources([{ url: '' }]);
      setShowSources(false);
    } catch (err) {
      console.error('[ThreadedDiscussion] Failed to post comment:', err);
      setError(err instanceof Error ? err.message : t('deliberation.thread.postFailed', "Couldn't post. Please try again."));
    } finally {
      setSubmitting(false);
    }
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
          // Enter in the comment body posts (shift+Enter = newline). Source rows
          // are separate inputs; whatever is entered there rides along on submit.
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      />
      {showSources
        ? <SourcesInput value={sources} onChange={setSources} label={t('deliberation.thread.sourcesLabel', 'Sources')} />
        : (
          <button type="button" className={styles.addSourcesBtn} onClick={() => setShowSources(true)}>
            {t('deliberation.thread.addSources', '+ Add sources')}
          </button>
        )}
      {error && <p className={styles.composeError} role="alert">{error}</p>}
      <div className={styles.composeActions}>
        <button type="button" className={styles.btnSubmit} onClick={submit} disabled={!text.trim() || submitting}>
          {submitting ? t('deliberation.thread.posting', 'Posting…') : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </button>
        )}
      </div>
      <span className={styles.count}>
        {t('deliberation.thread.disclosure', 'Comments are public to the community and kept as part of the discussion record.')}
      </span>
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
  onReply: (parentId: string, text: string, sources: SourceLink[]) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onLike: (id: string) => void | Promise<void>;
  onFocus: (id: string) => void;
  newCommentId?: string | null;
  newCommentRef?: React.RefCallback<HTMLDivElement>;
  onNewCommentBlur?: (id: string) => void;
}> = ({ node, depth, currentUserKey, profiles, trustOf, canParticipate, onReply, onDelete, onLike, onFocus, newCommentId, newCommentRef, onNewCommentBlur }) => {
  const { t, locale } = useI18n();
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isOwn = node.author === currentUserKey && !node.deleted;
  const name = displayName(node.author, profiles, isOwn, t('deliberation.you', 'You'));
  const likeCount = node.likes.length;
  const liked = node.likes.includes(currentUserKey);
  const atCap = depth >= DEPTH_CAP;
  const hasChildren = node.children.length > 0;

  const isNewComment = node.id === newCommentId;

  return (
    <div
      className={`${styles.commentItem} ${depth > 0 ? styles.nested : ''}`}
      ref={isNewComment && newCommentRef ? newCommentRef : undefined}
      tabIndex={isNewComment ? -1 : undefined}
      onBlur={isNewComment && onNewCommentBlur ? () => onNewCommentBlur(node.id) : undefined}
    >
      {depth > 0 && <div className={styles.threadLine} aria-hidden />}
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <UserIdentity
            name={name}
            countryCode={profiles[node.author]?.country}
            trustState={node.deleted ? undefined : trustOf(node.author)}
            size="sm"
          />
          <span className={styles.timestamp}>{formatDateTime(node.timestamp, locale)}</span>
          {hasChildren && !atCap && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? t('deliberation.thread.expand', 'Expand replies') : t('deliberation.thread.collapse', 'Collapse replies')}
            >
              {collapsed ? <><ChevronRight size={16} aria-hidden /> {node.children.length}</> : <ChevronDown size={16} aria-hidden />}
            </button>
          )}
        </div>

        <p className={styles.commentText}>{node.text}</p>

        {!node.deleted && (node.sources?.length ?? 0) > 0 && (
          <SourceLinks sources={node.sources!} className={styles.commentSources} />
        )}

        {!node.deleted && (
          <div className={styles.commentActions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
              onClick={() => onLike(node.id)}
              aria-pressed={liked}
            >
              {/* Visible "Like" label matches the labeled Reply/Delete neighbors (D5);
                  aria-pressed carries state, so no separate aria-label. */}
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} aria-hidden /> {t('deliberation.thread.like', 'Like')}{likeCount > 0 && <span> ({likeCount})</span>}
            </button>
            {canParticipate && (
              <button type="button" className={styles.actionBtn} onClick={() => setReplying((v) => !v)}>
                <Reply size={16} aria-hidden /> {t('deliberation.thread.reply', 'Reply')}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                onClick={() => onDelete(node.id)}
              >
                <Trash2 size={16} aria-hidden /> {t('deliberation.thread.delete', 'Delete')}
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
            onSubmit={async (text, sources) => { await onReply(node.id, text, sources); setReplying(false); }}
          />
        )}
      </div>

      {!collapsed && hasChildren && (
        atCap ? (
          <button type="button" className={styles.continueBtn} onClick={() => onFocus(node.id)}>
            <CornerDownRight size={16} aria-hidden /> {t('deliberation.thread.continue', 'Continue this thread ({n}) →', { n: node.children.length })}
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
                newCommentId={newCommentId}
                newCommentRef={newCommentRef}
                onNewCommentBlur={onNewCommentBlur}
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
  const [postedStatus, setPostedStatus] = useState('');
  const [newCommentId, setNewCommentId] = useState<string | null>(null);
  const newCommentElRef = useRef<HTMLDivElement | null>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newCommentRefCallback: React.RefCallback<HTMLDivElement> = useCallback((el) => {
    newCommentElRef.current = el;
  }, []);

  // Clear any pending announcement timer on unmount.
  useEffect(() => () => {
    if (announceTimer.current) clearTimeout(announceTimer.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      setFlat(await api.getComments(serverUrl, publicKey, contractId));
    } catch (err) {
      console.error('[ThreadedDiscussion] Failed to fetch comments:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => { refresh(); }, [refresh]);
  // Real contracts: no refetch after any write below — this SSE listener is
  // the only thing that refreshes afterward (for this contract's own write
  // confirmation event same as anyone else's). Demo contracts emit no
  // events at all, so each handler below falls back to a direct refetch.
  useContractSync(contractId, refresh);

  // Move focus to the newly-posted comment after refresh settles. A short
  // timeout (not rAF — rAF is throttled in backgrounded tabs) lets React commit
  // the ref + paint before we focus the scrolled-to element.
  useEffect(() => {
    if (!newCommentId) return;
    const id = setTimeout(() => {
      newCommentElRef.current?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [newCommentId]);

  // When the new comment loses focus, drop newCommentId so it no longer carries
  // tabIndex=-1 (no ordinary comment retains the attribute between posts). Only
  // clear if THIS comment is still the target — a newer post may have already
  // set a different id (its blur must not clobber the newer target).
  const handleNewCommentBlur = useCallback((blurredId: string) => {
    setNewCommentId((cur) => (cur === blurredId ? null : cur));
  }, []);

  const handleTopLevel = useCallback(async (text: string, sources: SourceLink[]) => {
    if (!serverUrl || !publicKey || !contractId) return;
    // Clear any prior status/focus before posting.
    if (announceTimer.current) clearTimeout(announceTimer.current);
    setPostedStatus('');
    const result = await api.addComment(serverUrl, publicKey, contractId, text, null, undefined, sources);
    // Demo contracts emit no SSE events — refetch directly, the only way a
    // demo write ever reconciles. Real contracts rely on useContractSync
    // above (fires from this same write's own confirmation event).
    if (isDemoContract(contractId)) await refresh();
    // Identify the new comment: the contract returns its new id directly as
    // part of the write's own result (not a second read), so this resolves
    // immediately regardless of whether the SSE-driven refresh above has
    // landed in `flat` yet.
    const returnedId = typeof result === 'string'
      ? result
      : result && typeof result === 'object' && 'id' in result
        ? String((result as { id: unknown }).id)
        : null;
    if (returnedId) {
      setNewCommentId(returnedId);
    } else {
      // Fallback: the newest root-level comment by timestamp is ours
      setFlat((prev) => {
        const latest = [...prev].filter((c) => !c.parentId).sort((a, b) => b.timestamp - a.timestamp)[0];
        if (latest) setNewCommentId(latest.id);
        return prev;
      });
    }
    // Announce on a separate commit so AT re-fires even on identical repeat
    // posts: the '' reset above and this set must land in distinct DOM commits.
    announceTimer.current = setTimeout(() => {
      setPostedStatus(t('deliberation.thread.posted', 'Comment posted'));
    }, 60);
  }, [serverUrl, publicKey, contractId, refresh, t]);

  const handleReply = useCallback(async (parentId: string, text: string, sources: SourceLink[]) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addComment(serverUrl, publicKey, contractId, text, parentId, undefined, sources);
    if (isDemoContract(contractId)) await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.deleteComment(serverUrl, publicKey, contractId, id);
    if (isDemoContract(contractId)) await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleLike = useCallback(async (id: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.likeComment(serverUrl, publicKey, contractId, id);
    if (isDemoContract(contractId)) await refresh();
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
      {/* Polite live region for screen-reader announcements (WCAG 4.1.3) */}
      <span
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      >
        {postedStatus}
      </span>

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
        <SegmentedControl<SortMode>
          options={[
            { value: 'top', label: t('deliberation.thread.sortTop', 'Top') },
            { value: 'newest', label: t('deliberation.thread.sortNewest', 'Newest') },
          ]}
          value={sort}
          onChange={setSort}
          ariaLabel={t('deliberation.thread.sortLabel', 'Sort comments')}
        />
      </div>

      {focusRootId && (
        <button type="button" className={styles.backBtn} onClick={() => setFocusRootId(null)}>
          <ArrowLeft size={16} aria-hidden /> {t('deliberation.thread.back', 'Back to full discussion')}
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
              newCommentId={newCommentId}
              newCommentRef={newCommentRefCallback}
              onNewCommentBlur={handleNewCommentBlur}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadedDiscussion;
