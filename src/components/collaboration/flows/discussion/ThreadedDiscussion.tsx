import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Reply, Trash2, Heart, MessageSquare, CornerDownRight, ArrowLeft, ChevronDown, ChevronRight,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { useAppSelector } from '../../../../store/hooks';
import { useI18n, useT } from '../../../../i18n';
import { useCommunityTrust } from '../../../../hooks/useCommunityTrust';
import type { TrustState } from '../../../../services/trust';
import { EmptyState, SegmentedControl, UserIdentity, SourceLinks, SourcesInput, Banner } from '../../../shared';
import { displayNameFor } from '../../../../utils/displayName';
import { formatDateTime } from '../../../../utils/formatDateTime';
import type { SourceLink } from '../../../../utils/sources';
import { tallyVotes, myVote, rankCauses, TOP_CAUSES_CARRIED } from '../../../../utils/causes';
import type { VoteTally } from '../../../../utils/causes';
import { computeDiscussionStatus } from '../../../../utils/discussionStatus';
import type { DiscussionStatus } from '../../../../utils/discussionStatus';
import { getHintSeen, markHintSeen } from '../../../onboarding/welcomeHints';
import * as api from './discussionApi';
import type { Comment, CommentVote } from './discussionApi';
import styles from './ThreadedDiscussion.module.scss';

// Indent levels 0..DEPTH_CAP render inline; at the cap a node with children
// collapses behind "Continue this thread →" (re-roots locally — no route).
const DEPTH_CAP = 3;

type SortMode = 'top' | 'newest';
type CommentNode = Comment & { children: CommentNode[] };
type ProfileMap = Record<string, { firstName?: string; lastName?: string; country?: string; displayName?: string }>;

function buildTree(flat: Comment[], sort: SortMode, tally: Record<string, VoteTally>): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  // ROOT comments are Causes candidates: 'top' ranks by vote score (up − down),
  // ties → older first. Replies aren't votable, so child nodes keep the
  // Heart-count comparator under both sort modes (D4).
  const rootCmp =
    sort === 'top'
      ? (a: CommentNode, b: CommentNode) => {
          const scoreA = (tally[a.id]?.up ?? 0) - (tally[a.id]?.down ?? 0);
          const scoreB = (tally[b.id]?.up ?? 0) - (tally[b.id]?.down ?? 0);
          return scoreB - scoreA || a.timestamp - b.timestamp;
        }
      : (a: CommentNode, b: CommentNode) => b.timestamp - a.timestamp;
  const childCmp =
    sort === 'top'
      ? (a: CommentNode, b: CommentNode) => b.likes.length - a.likes.length || a.timestamp - b.timestamp
      : (a: CommentNode, b: CommentNode) => b.timestamp - a.timestamp;
  const sortChildren = (nodes: CommentNode[]) => {
    nodes.sort(childCmp);
    nodes.forEach((n) => sortChildren(n.children));
  };
  roots.sort(rootCmp);
  roots.forEach((n) => sortChildren(n.children));
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
  onSubmit: (text: string, sources: SourceLink[]) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}> = ({ placeholder, submitLabel, onSubmit, onCancel, autoFocus }) => {
  const t = useT();
  const [text, setText] = useState('');
  const [sources, setSources] = useState<SourceLink[]>([{ url: '' }]);
  const [showSources, setShowSources] = useState(false);
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, sources);
    setText('');
    setSources([{ url: '' }]);
    setShowSources(false);
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
  onVote: (id: string, direction: 'up' | 'down') => void | Promise<void>;
  tally: Record<string, VoteTally>;
  voteOf: (id: string) => 'up' | 'down' | null;
  rankOf: (id: string) => number | undefined;
  onFocus: (id: string) => void;
  newCommentId?: string | null;
  newCommentRef?: React.RefCallback<HTMLDivElement>;
  onNewCommentBlur?: (id: string) => void;
}> = ({ node, depth, currentUserKey, profiles, trustOf, canParticipate, onReply, onDelete, onLike, onVote, tally, voteOf, rankOf, onFocus, newCommentId, newCommentRef, onNewCommentBlur }) => {
  const { t, locale } = useI18n();
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isOwn = node.author === currentUserKey && !node.deleted;
  const name = displayName(node.author, profiles, isOwn, t('deliberation.you', 'You'));
  const likeCount = node.likes.length;
  const liked = node.likes.includes(currentUserKey);
  const atCap = depth >= DEPTH_CAP;
  const hasChildren = node.children.length > 0;

  // Root-only Causes voting (D4): candidate causes are the ROOT comments.
  const nodeTally = tally[node.id] ?? { up: 0, down: 0 };
  const score = nodeTally.up - nodeTally.down;
  const mine = voteOf(node.id);
  const rank = rankOf(node.id);

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
            {!node.parentId ? (
              <>
                <div className={styles.voteGroup} role="group" aria-label={t('causes.vote.group', 'Vote on this cause')}>
                  <button type="button" className={`${styles.voteBtn} ${mine === 'up' ? styles.voteOn : ''}`}
                    aria-pressed={mine === 'up'} disabled={!canParticipate}
                    onClick={() => onVote(node.id, 'up')}
                    aria-label={t('causes.vote.up', 'Vote up — a real driver of the problem')}>
                    <ThumbsUp size={16} aria-hidden />
                  </button>
                  <span className={styles.voteScore} aria-label={t('causes.vote.score', 'Net score {n}', { n: score })}>{score > 0 ? `+${score}` : score}</span>
                  <button type="button" className={`${styles.voteBtn} ${mine === 'down' ? styles.voteOn : ''}`}
                    aria-pressed={mine === 'down'} disabled={!canParticipate}
                    onClick={() => onVote(node.id, 'down')}
                    aria-label={t('causes.vote.down', 'Vote down — not a real driver')}>
                    <ThumbsDown size={16} aria-hidden />
                  </button>
                </div>
                {rank != null && (
                  <span className={styles.rankChip}>{t('causes.rank', '#{n}', { n: rank })}</span>
                )}
              </>
            ) : (
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
            )}
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
                onVote={onVote}
                tally={tally}
                voteOf={voteOf}
                rankOf={rankOf}
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
  /** Fires whenever the computed five-band Causes status changes (S35 D6),
   *  so a caller (e.g. the page header subtitle) can mirror it without a
   *  second comments/votes fetch. */
  onStatus?: (status: DiscussionStatus) => void;
}

/**
 * One plain Reddit-style threaded chat for a discussion contract: post → reply →
 * heart, Top/Newest sort, indent-to-cap then "Continue this thread →". No
 * categories, no participation gate — discussion is conversation, not a threshold.
 */
const ThreadedDiscussion: React.FC<ThreadedDiscussionProps> = ({ contractId, communityId, canParticipate, emptyHint, onStatus }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = (useAppSelector((s) => s.communities.profiles) || {}) as ProfileMap;
  const currentUserKey = publicKey || '';
  const trust = useCommunityTrust(communityId);

  const [flat, setFlat] = useState<Comment[]>([]);
  const [votes, setVotes] = useState<CommentVote[]>([]);
  // D5 fix-round: `onStatus` must not fire on the empty initial state — that
  // would compute a status off zero comments/votes and flash "New" in a host
  // header's subtitle before the first real fetch lands.
  const [loaded, setLoaded] = useState(false);
  const [sort, setSort] = useState<SortMode>('top');
  const [showVoteHint, setShowVoteHint] = useState(() => !getHintSeen('causesVoteHint'));
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
      const [list, v] = await Promise.all([
        api.getComments(serverUrl, publicKey, contractId),
        api.getCommentVotes(serverUrl, publicKey, contractId).catch(() => []),
      ]);
      setFlat(list);
      setVotes(v);
      setLoaded(true);
    } catch (err) {
      console.error('[ThreadedDiscussion] Failed to fetch comments:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => { refresh(); }, [refresh]);

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
    await refresh();
    // Identify the new comment: use the returned id if available, else diff the list
    const returnedId = result && typeof result === 'object' && 'id' in result
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

  const handleVote = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (!serverUrl || !publicKey || !contractId) return;
    const current = myVote(votes, publicKey, id);
    const next = current === direction ? 'none' : direction; // tap again to clear
    await api.voteComment(serverUrl, publicKey, contractId, id, next);
    // isDemoContract is not importable here (seam rule) — always refresh; real
    // contracts also refresh via useContractSync upstream, this is a no-op there.
    await refresh();
  }, [serverUrl, publicKey, contractId, votes, refresh]);

  const tally = useMemo(() => tallyVotes(votes), [votes]);

  // Five-band Causes status (S35 D6): mirrored up to the caller so the page
  // header can show it without a second comments/votes fetch. Gated on
  // `loaded` (D5 fix-round) — otherwise this fires once on mount with `flat`/
  // `votes` still at their empty initial state, and a host header's subtitle
  // flashes "New" before the first real fetch lands.
  useEffect(() => {
    if (!loaded) return;
    if (onStatus) onStatus(computeDiscussionStatus(flat, votes));
  }, [loaded, flat, votes, onStatus]);

  const ranks = useMemo(() => rankCauses(flat, votes), [flat, votes]);
  // Rank chips are noise on an unvoted root — only show for roots carried into
  // Solutions (rank ≤ TOP_CAUSES_CARRIED) that have at least one vote either way.
  const rankById = useMemo(() => {
    const m: Record<string, number> = {};
    ranks.forEach((r) => {
      if (r.up + r.down > 0 && r.rank <= TOP_CAUSES_CARRIED) m[r.comment.id] = r.rank;
    });
    return m;
  }, [ranks]);
  const voteOf = useCallback((id: string) => myVote(votes, currentUserKey, id), [votes, currentUserKey]);
  const rankOf = useCallback((id: string) => rankById[id], [rankById]);

  const tree = useMemo(() => buildTree(flat, sort, tally), [flat, sort, tally]);
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
          placeholder={t('causes.composer.placeholder', 'What is causing this problem?')}
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

      {/* F6: the vote hint only makes sense above a list the viewer can
          actually vote on — an empty discussion, or a viewer who can't
          participate, never shows it. */}
      {showVoteHint && canParticipate && visibleRoots.length > 0 && (
        <Banner
          tone="info"
          onDismiss={() => { markHintSeen('causesVoteHint'); setShowVoteHint(false); }}
          dismissLabel={t('common.dismiss', 'Dismiss')}
        >
          {t('causes.hint', "Vote up if this is a real driver of the problem, down if it isn't.")}
        </Banner>
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
              onVote={handleVote}
              tally={tally}
              voteOf={voteOf}
              rankOf={rankOf}
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
