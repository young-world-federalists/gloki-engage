# Session 2 — Problem card + Discussion-as-chat (+ author DM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the problem card simple (de-boxed, reordered, two clear CTA buttons) and turn the Discussion stage into one shared plain threaded chat (hearts, Top/Newest sort, continue-thread nesting), plus a full-page author DM — killing the confusing 33% "gate."

**Architecture:** One new shared `ThreadedDiscussion` component renders the per-initiative discussion sub-contract's existing threaded comments (`add_comment`/`get_comments`/`delete_comment`, nesting via `parentId`) with a new `like_comment` 1p1v toggle; it replaces the heavy co-authoring on the Discussion stage and the category UI on the collab Discussion flow. The author DM is a full page reusing the flat `chat` mechanic (`chatApi` + `chat` contract) as a per-pair contract. The problem card de-boxes `ProblemVoteFlow`, reorders to vote → threshold line → two `<Button>` CTAs, and drops the framing modal. Co-authoring code is left dormant for Session 3.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules + lucide-react.

**Spec:** `docs/superpowers/specs/2026-06-26-problem-card-discussion-chat-design.md`.

## Global Constraints

- **Branch `ui`; keep it runnable.** No backend, no real server calls. Reads/writes stay behind `src/services/api.ts`. The demo seam emits **no `contract_write` events** → **re-fetch after every write** (the ConcernsFlow/funding pattern).
- **Tokens only — no ad-hoc hex/px/rgba.** Tinted variants derive from a token (`rgba($primary, 0.1)`). Colour means only "stage" or "status" (`DESIGN_SYSTEM.md`).
- **Reuse the kit + `UserIdentity`.** Prefer `Button`/`Card`/`Modal`/`Banner`/`EmptyState`/`UserIdentity` over bespoke markup.
- **Production build runs `tsc -b`.** A task is not done until `npm run build` is clean (zero TS errors).
- **No test framework.** Verify each task via `npm run dev` + the `preview_*` tools: screenshot the affected surface at **360px wide**, in **light and dark** (`prefers-color-scheme`). Dev server is `gloki-dev` (port 5173). Never claim done without the screenshot.
- **Flagship target 360px Android**, light + dark.
- **i18n parity.** New user-facing strings ship at **fr + sw key parity** (`src/i18n/fr.ts` + `src/i18n/sw.ts`); components use `t('key', 'English default')` inline. New/reworded fr+sw strings are appended to `docs/i18n-native-review-candidates.md` (human native review is gated separately).
- **AA gate.** No standalone text in `$gray-400`; ≥44px touch on interactive controls (hearts, CTAs, sort, send); visible focus rings.
- **One new contract method this session:** `like_comment` — document it for Ouri (a comment block in `discussion.ts`). The DM adds **no** new contract (reuses `chat`).
- **Dormant, not deleted:** `SharedStatement`, `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar`, the co-authoring `discussionApi`/contract methods, `useDiscussionData`, and `proposeCandidateIssue` — left in place with a "reserved for Write Together (S3)" comment; only their *usage* is removed.

---

## File Structure

**New**
- `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` + `.module.scss` — the plain threaded chat (hearts, Top/Newest, continue-thread). Renders one discussion contract's thread.
- `src/components/collaboration/SuggestionDmView.tsx` + `.module.scss` — full-page author DM (reuses `chatApi`).

**Modified**
- `src/services/demo/demoContracts/discussion.ts` — `likes` on comments + `like_comment` write.
- `src/components/collaboration/flows/discussion/discussionApi.ts` — `likes` on `Comment` + `likeComment()`.
- `src/components/collaboration/DiscussionStageView.tsx` — swap co-authoring → `ThreadedDiscussion`; remove 33% meter/co-presence; copy.
- `src/components/collaboration/flows/discussion/DiscussionFlow.tsx` — thin wrapper over `ThreadedDiscussion`.
- `src/components/initiative/stages/DiscussionEngage.tsx` (+ `.module.scss`) — light comment-count teaser; remove meter/co-presence.
- `src/components/community/DiscussionActivityCard.tsx` — open-label key value; drop the `memberCount` arg.
- `src/components/initiative/stages/ProblemEngage.tsx` (+ `.module.scss`) — de-box reorder; two `<Button>` CTAs; remove framing modal; thread author props.
- `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss` — remove `.votingSection` card chrome.
- `src/components/community/ProblemActivityCard.tsx` — pass `authorKey`/`authorName` into `ProblemEngage`.
- `src/pages/collaboration/InitiativeView.tsx` — add the `/suggest` route branch.
- `src/components/stages/ProblemStage.demo.ts` — dormancy comment on `proposeCandidateIssue`.
- `src/i18n/fr.ts` + `src/i18n/sw.ts` — new keys, reworded keys, prune orphaned.
- `docs/i18n-native-review-candidates.md` — append the new/reworded fr+sw strings.

---

## Task 1: Hearts data layer (`like_comment` in the demo contract + api)

Additive: extend the threaded comment shape with a 1p1v `likes` list and a `like_comment` toggle. Nothing renders differently yet.

**Files:**
- Modify: `src/services/demo/demoContracts/discussion.ts`
- Modify: `src/components/collaboration/flows/discussion/discussionApi.ts`

**Interfaces:**
- Produces: `Comment.likes: string[]` (api) and `likeComment(serverUrl, publicKey, contractId, commentId)` → `Promise<unknown>`. Consumed by Task 2.

- [ ] **Step 1: Demo contract — add `likes` to the comment shape.** In `discussion.ts`, add `likes: string[];` to the `DiscussionComment` interface (after `deleted?`):

```ts
interface DiscussionComment {
  id: string;
  author: string;
  text: string;
  parentId: string | null;
  timestamp: number;
  category?: 'evidence' | 'impact' | 'solutions' | 'concerns';
  deleted?: boolean;
  likes: string[]; // 1p1v pubkeys — surfaces "top" replies; no advancement effect
}
```

- [ ] **Step 2: Demo contract — seed `likes: []` on new comments.** In the `add_comment` case, add `likes: []` to the created `comment` object:

```ts
const comment: DiscussionComment = {
  id: newId(),
  author: caller,
  text,
  parentId: (method.values?.parentId as string | null | undefined) ?? null,
  timestamp: Date.now(),
  category: method.values?.category as DiscussionComment['category'],
  likes: [],
};
```

- [ ] **Step 3: Demo contract — add the `like_comment` write.** In `discussionWrite`, immediately after the `delete_comment` case (before the `// --- co-authoring: shared statement ---` group), add a `like_comment` case that toggles the caller (1p1v). Also add the documenting comment for Ouri:

```ts
    // 1p1v like toggle on a threaded comment — surfaces "top" replies in the UI;
    // it does NOT gate advancement. NEW METHOD FOR OURI: `like_comment(comment_id)`
    // appends/removes the caller's pk on the comment's `likes` list (dedup).
    case 'like_comment': {
      const id = method.values?.comment_id as string | undefined;
      if (!id) return null;
      updateState<DiscussionState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        comments: (s.comments ?? []).map((c) => {
          if (c.id !== id || c.deleted) return c;
          const likes = c.likes ?? [];
          return {
            ...c,
            likes: likes.includes(caller) ? likes.filter((pk) => pk !== caller) : [...likes, caller],
          };
        }),
      }));
      return null;
    }
```

- [ ] **Step 4: API — add `likes` to `Comment` + `RawComment`, normalize it.** In `discussionApi.ts`: add `likes: string[];` to the `Comment` interface (after `deleted?`); add `likes?: unknown;` to `RawComment`; and in `normalizeComment`, add the `likes` field (inline array-of-strings guard — `strArr` is defined later in the file, so do not call it here):

```ts
function normalizeComment(raw: RawComment): Comment {
  const deleted = !!raw.deleted;
  return {
    id: String(raw.id ?? ''),
    author: String(raw.author ?? ''),
    text: deleted ? '[deleted]' : String(raw.text ?? ''),
    parentId: raw.parentId ? String(raw.parentId) : null,
    timestamp: normalizeTimestamp(raw.timestamp),
    category: raw.category ? (raw.category as CommentCategory) : undefined,
    deleted,
    likes: Array.isArray(raw.likes) ? raw.likes.map((x) => String(x)).filter(Boolean) : [],
  };
}
```

- [ ] **Step 5: API — add `likeComment`.** In `discussionApi.ts`, after `deleteComment`, add:

```ts
export async function likeComment(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  commentId: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'like_comment', values: { comment_id: commentId } } as IMethod,
  });
}
```

- [ ] **Step 6: Type-check.** Run: `npm run build` — Expected: clean.
- [ ] **Step 7: Commit.**

```bash
git add src/services/demo/demoContracts/discussion.ts src/components/collaboration/flows/discussion/discussionApi.ts
git commit -m "feat(discussion): 1p1v like_comment toggle + likes on comments (demo seam + api)"
```

---

## Task 2: `ThreadedDiscussion` component + swap into `DiscussionStageView`

Build the one shared plain threaded chat and make it the Discussion stage page (its primary, verifiable mount).

**Files:**
- Create: `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx`
- Create: `src/components/collaboration/flows/discussion/ThreadedDiscussion.module.scss`
- Modify: `src/components/collaboration/DiscussionStageView.tsx`

**Interfaces:**
- Consumes (Task 1): `Comment.likes`, `likeComment`.
- Produces: `ThreadedDiscussion` (default export), props `{ contractId: string; communityId?: string; canParticipate: boolean; emptyHint?: string }`. Consumed by Tasks 3, (stage) here, and the collab flow.

- [ ] **Step 1: Create `ThreadedDiscussion.tsx`** with this exact content:

```tsx
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
```

- [ ] **Step 2: Create `ThreadedDiscussion.module.scss`** with this exact content:

```scss
@use '../../../../styles/variables' as *;

.container { display: flex; flex-direction: column; gap: $spacing-md; }

/* Composer */
.composeBox { display: flex; flex-direction: column; gap: $spacing-sm; }
.composeTextarea {
  width: 100%;
  box-sizing: border-box;
  padding: $spacing-sm $spacing-md;
  font: inherit;
  font-size: $text-sm;
  line-height: 1.5;
  color: $gray-900;
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  resize: vertical;

  &::placeholder { color: $gray-500; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 1px; border-color: $primary; }

  @media (prefers-color-scheme: dark) {
    color: $dark-text;
    background: $dark-bg;
    border-color: $dark-border;
    &::placeholder { color: $dark-text-secondary; }
  }
}
.composeActions { display: flex; gap: $spacing-sm; }
.btnSubmit {
  min-height: 44px;
  padding: $spacing-xs $spacing-lg;
  background: $primary;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: $primary-dark; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}
.btnCancel {
  min-height: 44px;
  padding: $spacing-xs $spacing-md;
  background: none;
  color: $gray-600;
  border: none;
  border-radius: $radius-md;
  font-size: $text-sm;
  cursor: pointer;

  &:hover { text-decoration: underline; }
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}

/* Toolbar: count + sort toggle */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; }
.count {
  font-size: $text-xs;
  color: $gray-500;
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.sortToggle { display: inline-flex; gap: $spacing-xs; }
.sortBtn, .sortActive {
  min-height: 36px;
  padding: $spacing-xs $spacing-sm;
  font-size: $text-xs;
  font-weight: $font-medium;
  border-radius: $radius-md;
  border: 1px solid transparent;
  background: none;
  color: $gray-500;
  cursor: pointer;

  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.sortActive {
  color: $primary;
  background: rgba($primary, 0.1);
  @media (prefers-color-scheme: dark) { color: $dark-text; background: rgba($primary, 0.25); }
}

.backBtn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  align-self: flex-start;
  min-height: 44px;
  padding: $spacing-xs $spacing-sm;
  margin-left: -#{$spacing-sm};
  background: none;
  border: none;
  border-radius: $radius-md;
  color: $primary;
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}

/* Thread */
.commentList { display: flex; flex-direction: column; gap: $spacing-md; }
.commentItem { position: relative; }
.nested { margin-left: $spacing-md; padding-left: $spacing-md; }
.threadLine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: $gray-200;
  border-radius: $radius-full;
  @media (prefers-color-scheme: dark) { background: $dark-border; }
}

.commentBody { display: flex; flex-direction: column; gap: $spacing-xs; }
.commentHeader { display: flex; align-items: center; gap: $spacing-sm; flex-wrap: wrap; }
.timestamp {
  font-size: $text-xs;
  color: $gray-500;
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.collapseBtn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 32px;
  padding: 0 $spacing-xs;
  background: none;
  border: none;
  color: $gray-500;
  font-size: $text-xs;
  cursor: pointer;

  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.commentText {
  margin: 0;
  font-size: $text-sm;
  line-height: 1.6;
  color: $gray-800;
  white-space: pre-wrap;
  word-break: break-word;
  @media (prefers-color-scheme: dark) { color: $dark-text; }
}

.commentActions { display: flex; align-items: center; gap: $spacing-md; }
.actionBtn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  min-height: 44px;
  padding: $spacing-xs;
  background: none;
  border: none;
  color: $gray-500;
  font-size: $text-xs;
  font-weight: $font-medium;
  cursor: pointer;

  &:hover { color: $primary; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.liked {
  color: $error;
  &:hover { color: $error-dark; }
}
.actionBtnDelete {
  &:hover { color: $error; }
}

.continueBtn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  margin-left: $spacing-md;
  min-height: 44px;
  padding: $spacing-xs $spacing-sm;
  background: none;
  border: none;
  color: $primary;
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}
.children { display: flex; flex-direction: column; gap: $spacing-md; margin-top: $spacing-md; }
```

- [ ] **Step 3: Swap `DiscussionStageView` to render `ThreadedDiscussion`.** Replace the imports block (lines 11–18) — remove the co-authoring imports, add `ThreadedDiscussion`:

```tsx
import { useFlowContract } from './flows/shared/useFlowContract';
import useCommunityTrust from '../../hooks/useCommunityTrust';
import ThreadedDiscussion from './flows/discussion/ThreadedDiscussion';
import cs from '../../pages/Container.module.scss';
import styles from './DiscussionStageView.module.scss';
```

(That deletes the `useDiscussionData`, `SharedStatement`, `PositionsBoard`, `ParticipationMeter`, `AnchoredThread`, `CoPresenceBar`, and `DELIBERATION_*` imports.)

- [ ] **Step 4: Drop the co-authoring data read + member-count denominator.** In `DiscussionStageView`, delete the `const data = useDiscussionData(contractId, isReady);` line and the `members`/`memberCount` selectors **only if unused after** — keep the `members` selector and its fetch (it feeds `useCommunityTrust`); delete `const memberCount = …`. Keep `canParticipate`.

- [ ] **Step 5: Replace the success branch.** Replace the entire `) : (` … `</>` success block (the `<>` containing `copresence`, the empty-state special-case, `SharedStatement`, and `PositionsBoard`, lines ~93–139) with:

```tsx
            ) : (
              <ThreadedDiscussion
                contractId={contractId}
                communityId={communityId}
                canParticipate={canParticipate}
                emptyHint={t('deliberation.thread.empty', 'Start the conversation about this problem.')}
              />
            )}
```

- [ ] **Step 6: Reword the loading copy.** In the `!isReady` branch, change the default for `deliberation.settingUp`:

```tsx
<p>{statusMessage || (isDeploying ? t('deliberation.settingUp', 'Setting up the discussion…') : t('deliberation.loading', 'Loading…'))}</p>
```

- [ ] **Step 7: Type-check.** Run: `npm run build` — Expected: clean. (If "declared but never read" fires for `EmptyState` or a fixture import, remove that now-unused import from `DiscussionStageView`.)
- [ ] **Step 8: Visual verify.** Ensure dev server (`preview_start` if needed). Open the seeded showcase discussion: navigate to a community with the seeded "Digital Rights Coalition"/misinfo initiative → its problem card → **Discuss this problem**, or directly to `/initiative/.../discussion`. Screenshot at **360px, light + dark**. Confirm: a threaded chat (post → reply → heart); **Top/Newest** re-sorts; replies indent then show **"Continue this thread →"** which re-roots, and **"Back to full discussion"** returns; **no** category chips / filter / 33% meter. Verify a heart toggles and the count updates after the re-fetch.
- [ ] **Step 9: Commit.**

```bash
git add src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx src/components/collaboration/flows/discussion/ThreadedDiscussion.module.scss src/components/collaboration/DiscussionStageView.tsx
git commit -m "feat(discussion): ThreadedDiscussion (hearts + sort + continue-thread); stage uses it, drops co-authoring + 33% gate"
```

---

## Task 3: Collab `DiscussionFlow` → thin wrapper over `ThreadedDiscussion`

One threaded UI everywhere: the collab-menu Discussion flow drops its category UI and renders `ThreadedDiscussion`.

**Files:**
- Modify (replace whole file): `src/components/collaboration/flows/discussion/DiscussionFlow.tsx`

**Interfaces:**
- Consumes: `ThreadedDiscussion` (Task 2). Keeps the registry contract (`FlowProps`, default export) unchanged.

- [ ] **Step 1: Replace `DiscussionFlow.tsx`** entirely with this thin wrapper:

```tsx
import React from 'react';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import type { FlowProps } from '../types';
import { useAppSelector } from '../../../../store/hooks';
import { useFlowContract } from '../shared/useFlowContract';
import { useT } from '../../../../i18n';
import ThreadedDiscussion from './ThreadedDiscussion';
import styles from './DiscussionFlow.module.scss';

/**
 * Collab-menu "Discussion" flow — now a thin wrapper over the shared
 * {@link ThreadedDiscussion} (one threaded UI everywhere). No community context
 * here (FlowProps carries none), so author shields are omitted; flag + name still
 * render. Backed by the same discussion sub-contract comment group.
 */
const DiscussionFlow: React.FC<FlowProps> = ({ instanceId, parentContractId, stageKey }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'discussion', 'discussion_contract.py', '', parentContractId, stageKey,
  );

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <AlertTriangle size={36} />
          <p>{errorMessage}</p>
          <button className={styles.btnSubmit} onClick={retry}>{t('common.retry', 'Try again')}</button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{statusMessage || (isDeploying ? t('deliberation.settingUp', 'Setting up the discussion…') : t('common.loading', 'Loading…'))}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ThreadedDiscussion contractId={contractId} canParticipate={!!publicKey} />
    </div>
  );
};

export default DiscussionFlow;
```

- [ ] **Step 2: Type-check.** Run: `npm run build` — Expected: clean. (The category helpers, `CATEGORIES`, `discussionApi` co-authoring imports, etc. are gone with the old file; `DiscussionFlow.module.scss` keeps `.container`/`.empty`/`.btnSubmit` which the wrapper still uses — leave the rest of that scss in place, harmless.)
- [ ] **Step 3: Visual verify.** Open a community → **Collaborate** → an initiative's **Discussion** flow (collab menu, "Teamwork" group). Screenshot 360px light + dark. Confirm the same plain threaded chat renders (no categories/filter/progress); posting + hearts work.
- [ ] **Step 4: Commit.**

```bash
git add src/components/collaboration/flows/discussion/DiscussionFlow.tsx
git commit -m "refactor(discussion): collab DiscussionFlow becomes a thin wrapper over ThreadedDiscussion"
```

---

## Task 4: Simplify `DiscussionEngage` teaser + flip the open label

The Discussion stage card's Engage preview becomes a light comment-count teaser (no 33% meter / co-presence); the card's open button reads "Open the discussion."

**Files:**
- Modify (replace whole file): `src/components/initiative/stages/DiscussionEngage.tsx`
- Modify: `src/components/initiative/stages/DiscussionEngage.module.scss` (trim unused rules — keep `.engage` + `.preview`)
- Modify: `src/components/community/DiscussionActivityCard.tsx`

**Interfaces:**
- `DiscussionEngage` props reduce to `{ initiativeId: string }`.

- [ ] **Step 1: Replace `DiscussionEngage.tsx`** with the light teaser:

```tsx
import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useAppSelector } from '../../../store/hooks';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import { getComments } from '../../collaboration/flows/discussion/discussionApi';
import styles from './DiscussionEngage.module.scss';

export interface DiscussionEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
}

/**
 * The Discussion stage's Engage preview inside the shared InitiativeStageCard:
 * a light "N comments · M people" teaser (from the live discussion sub-contract)
 * over a friendly empty state. Read-only — the full thread + composer live in the
 * Discussion stage page (the shell's "Open the discussion"). No participation
 * gate (discussion is conversation, not a threshold).
 */
const DiscussionEngage: React.FC<DiscussionEngageProps> = ({ initiativeId }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const { contractId, isReady } = useFlowContract(
    `discussion-${initiativeId}`,
    'discussion',
    'discussion_contract.py',
    '',
    initiativeId,
    'discussionContractId',
  );

  const [teaser, setTeaser] = useState({ count: 0, people: 0 });

  useEffect(() => {
    if (!isReady || !serverUrl || !publicKey || !contractId) return;
    let cancelled = false;
    getComments(serverUrl, publicKey, contractId)
      .then((list) => {
        if (cancelled) return;
        const live = list.filter((c) => !c.deleted);
        setTeaser({ count: live.length, people: new Set(live.map((c) => c.author)).size });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isReady, serverUrl, publicKey, contractId]);

  return (
    <div className={styles.engage}>
      {teaser.count > 0 ? (
        <p className={styles.preview}>
          {t('deliberation.discussion.teaser', '{c} comments · {p} people', { c: teaser.count, p: teaser.people })}
        </p>
      ) : (
        <EmptyState
          compact
          icon={<MessageSquare size={28} aria-hidden />}
          title={t('deliberation.empty.title', 'No discussion yet')}
          message={t('deliberation.empty.body', 'Be the first to weigh in on this problem.')}
        />
      )}
    </div>
  );
};

export default DiscussionEngage;
```

- [ ] **Step 2: Trim `DiscussionEngage.module.scss`.** Keep `.engage` and `.preview`; remove any now-unused rules (e.g. co-presence/meter wrappers) if present. Confirm `.preview` exists; if not, add:

```scss
.preview {
  margin: 0;
  font-size: $text-sm;
  color: $gray-600;
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
```

- [ ] **Step 3: Update `DiscussionActivityCard`.** Change the open label default and drop the `memberCount` arg to `DiscussionEngage`:

```tsx
      openLabel={t('deliberation.discussion.open', 'Open the discussion')}
```

```tsx
      <DiscussionEngage initiativeId={item.id} />
```

(If `activeMemberCount`/its selectors become unused in that file after dropping the arg, leave them — they may still feed `StageAdvanceBar`/threshold; only remove if `npm run build` flags them unused.)

- [ ] **Step 4: Type-check.** Run: `npm run build` — Expected: clean. Fix any "unused" import flagged in `DiscussionEngage`/`DiscussionActivityCard`.
- [ ] **Step 5: Visual verify.** Community page → the Discussion-stage card (seeded initiative). Screenshot 360px light + dark. Confirm: collapsed teaser/expanded preview shows "N comments · M people" (or the empty state) with **no** 33% meter; the open button reads **"Open the discussion"** and routes to the threaded page.
- [ ] **Step 6: Commit.**

```bash
git add src/components/initiative/stages/DiscussionEngage.tsx src/components/initiative/stages/DiscussionEngage.module.scss src/components/community/DiscussionActivityCard.tsx
git commit -m "refactor(discussion): light comment-teaser preview; 'Open the discussion' label; drop 33% meter from card"
```

---

## Task 5: Author DM — `SuggestionDmView` + `/suggest` route

A full-page 1:1 suggestion thread reusing the flat chat mechanic.

**Files:**
- Create: `src/components/collaboration/SuggestionDmView.tsx`
- Create: `src/components/collaboration/SuggestionDmView.module.scss`
- Modify: `src/pages/collaboration/InitiativeView.tsx`

**Interfaces:**
- Consumes: `chatApi` (`getMessages`/`addMessage`), `useFlowContract` (per-user `chat`), `AppHeader`, `UserIdentity`, `EmptyState`.
- Route: `/initiative/:host/:agent/:communityId/:initiativeId/suggest`, nav `state: { authorKey, authorName }` (set by Task 6).

- [ ] **Step 1: Create `SuggestionDmView.tsx`:**

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../i18n';
import AppHeader from '../AppHeader';
import { EmptyState, UserIdentity } from '../shared';
import { useFlowContract } from './flows/shared/useFlowContract';
import { getMessages, addMessage } from '../community/chat/chatApi';
import type { ChatMessage } from '../community/chat/chatApi';
import cs from '../../pages/Container.module.scss';
import styles from './SuggestionDmView.module.scss';

// One implicit thread per DM contract — the flat chat mechanic only needs a topic
// id string (no topic record). The DM contract itself is keyed per requester via
// useFlowContract per-user mode, scoped to the initiative.
const DM_TOPIC = 'dm';

interface SuggestionDmViewProps {
  communityId: string;
  initiativeId: string;
}

/**
 * Full-page 1:1 "suggestion to the author" DM. Reuses the flat chat contract
 * (chatApi) as a private per-requester contract. One-way in the single-user demo
 * (the author is a seeded persona). FOR OURI: the real DM is a 1:1 contract keyed
 * by the unordered {author, requester} pair.
 */
const SuggestionDmView: React.FC<SuggestionDmViewProps> = ({ initiativeId }) => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { authorKey, authorName } = (location.state as { authorKey?: string; authorName?: string }) || {};

  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const { contractId, isReady } = useFlowContract(`dm-${initiativeId}`, 'chat', 'chat_contract.py', '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const list = await getMessages(serverUrl, publicKey, contractId, DM_TOPIC);
      if (!cancelled.current) setMessages(list);
    } catch (err) {
      console.error('[SuggestionDmView] Failed to fetch messages:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    cancelled.current = false;
    if (isReady) refresh();
    return () => { cancelled.current = true; };
  }, [isReady, refresh]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const authorProfile = authorKey ? profiles?.[authorKey] : undefined;
  const authorDisplay =
    authorName ||
    (authorProfile ? `${authorProfile.firstName || ''} ${authorProfile.lastName || ''}`.trim() : '') ||
    t('suggest.author', 'the author');

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !publicKey || !serverUrl || !contractId || sending) return;
    const optimistic: ChatMessage = {
      id: `optimistic_${Date.now()}`, topicId: DM_TOPIC, author: publicKey, text: trimmed, timestamp: Date.now(),
    };
    const snapshot = messages;
    setMessages([...snapshot, optimistic]);
    setInput('');
    setSending(true);
    try {
      await addMessage(serverUrl, publicKey, contractId, DM_TOPIC, trimmed);
      await refresh();
    } catch (err) {
      console.error('[SuggestionDmView] Failed to send:', err);
      if (!cancelled.current) setMessages(snapshot);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} title={authorDisplay} eyebrow={t('suggest.eyebrow', 'Suggestion')} />
      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={styles.thread}>
          {messages.length === 0 ? (
            <EmptyState
              compact
              icon={<Send size={28} aria-hidden />}
              title={t('suggest.emptyTitle', 'Send a private suggestion')}
              message={t('suggest.empty', 'Your suggestion goes privately to {name}.', { name: authorDisplay })}
            />
          ) : (
            messages.map((m) => {
              const isOwn = m.author === publicKey;
              const p = profiles?.[m.author];
              const nm = isOwn
                ? t('deliberation.you', 'You')
                : (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '') || authorDisplay;
              return (
                <div key={m.id} className={`${styles.message} ${isOwn ? styles.mine : ''}`}>
                  <div className={styles.meta}>
                    <UserIdentity name={nm} countryCode={p?.country} size="sm" />
                    <span className={styles.time}>
                      {new Date(m.timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className={styles.text}>{m.text}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </main>
      <div className={styles.inputBar}>
        <textarea
          className={styles.textarea}
          rows={1}
          placeholder={t('suggest.placeholder', 'Write your suggestion…')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || !publicKey || sending}
          aria-label={t('suggest.send', 'Send suggestion')}
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default SuggestionDmView;
```

- [ ] **Step 2: Create `SuggestionDmView.module.scss`:**

```scss
@use '../../styles/variables' as *;

.thread { display: flex; flex-direction: column; gap: $spacing-md; padding: $spacing-md 0; }

.message { display: flex; flex-direction: column; gap: $spacing-xs; max-width: 85%; }
.mine { align-self: flex-end; align-items: flex-end; }

.meta { display: flex; align-items: center; gap: $spacing-sm; }
.time {
  font-size: $text-xs;
  color: $gray-500;
  @media (prefers-color-scheme: dark) { color: $dark-text-secondary; }
}
.text {
  padding: $spacing-sm $spacing-md;
  font-size: $text-sm;
  line-height: 1.5;
  color: $gray-800;
  background: $gray-50;
  border-radius: $radius-md;
  white-space: pre-wrap;
  word-break: break-word;

  @media (prefers-color-scheme: dark) { color: $dark-text; background: $dark-surface; }
}
.mine .text { color: white; background: $primary; }

.inputBar { display: flex; gap: $spacing-sm; align-items: flex-end; padding: $spacing-sm 0; }
.textarea {
  flex: 1;
  box-sizing: border-box;
  padding: $spacing-sm $spacing-md;
  font: inherit;
  font-size: $text-sm;
  line-height: 1.4;
  color: $gray-900;
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  resize: none;

  &::placeholder { color: $gray-500; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 1px; border-color: $primary; }
  @media (prefers-color-scheme: dark) { color: $dark-text; background: $dark-bg; border-color: $dark-border; &::placeholder { color: $dark-text-secondary; } }
}
.sendBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: $primary;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: $primary-dark; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}
```

- [ ] **Step 3: Add the `/suggest` route to `InitiativeView`.** Import the view, add the pathname check + branch (mirroring `isDiscussion`):

```tsx
import SuggestionDmView from '../../components/collaboration/SuggestionDmView';
```

```tsx
  const isDiscussion = location.pathname.endsWith('/discussion');
  const isSuggest = location.pathname.endsWith('/suggest');
  const isCollaboration = location.pathname.endsWith('/collaboration');

  if (isSuggest) {
    return <SuggestionDmView communityId={communityId!} initiativeId={initiativeId!} />;
  }

  if (isDiscussion) {
```

- [ ] **Step 4: Type-check.** Run: `npm run build` — Expected: clean.
- [ ] **Step 5: Visual verify (direct URL).** With dev server running, navigate to a seeded initiative's suggest route, e.g. via `preview_eval` setting `window.location` to `/initiative/<host>/<agent>/<communityId>/<initiativeId>/suggest` (the entry button lands in Task 6). Screenshot 360px light + dark. Confirm: an `AppHeader` ("Suggestion" eyebrow, author title), empty state, a working composer + send (the sent bubble appears), and **back** returns. (Author identity falls back to "the author" when navigated by raw URL without nav state — expected.)
- [ ] **Step 6: Commit.**

```bash
git add src/components/collaboration/SuggestionDmView.tsx src/components/collaboration/SuggestionDmView.module.scss src/pages/collaboration/InitiativeView.tsx
git commit -m "feat(dm): full-page author suggestion DM (reuses flat chat) + /suggest route"
```

---

## Task 6: Problem card — de-box + reorder + two CTA buttons

De-box `ProblemVoteFlow`, reorder `ProblemEngage` (vote → threshold line → two `<Button>` CTAs), remove the framing modal, thread author props for the DM, and audit expand-in-place.

**Files:**
- Modify: `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss`
- Modify (replace whole file): `src/components/initiative/stages/ProblemEngage.tsx`
- Modify: `src/components/initiative/stages/ProblemEngage.module.scss`
- Modify: `src/components/community/ProblemActivityCard.tsx`
- Modify: `src/components/stages/ProblemStage.demo.ts`

- [ ] **Step 1: De-box the voting section.** In `ProblemVoteFlow.module.scss`, replace the `.votingSection` rule (lines ~100–112) so it has no card chrome — keep only the heading:

```scss
.votingSection {
  h4 {
    font-size: $text-base;
    font-weight: $font-semibold;
    color: $gray-800;
    margin-bottom: $spacing-lg;
  }
}
```

And in the dark-mode block (lines ~262–269), replace the `.votingSection { background; border-color; h4 { color } }` rule with just the heading colour:

```scss
  .votingSection h4 {
    color: $dark-text;
  }
```

- [ ] **Step 2: Replace `ProblemEngage.tsx`** with the reordered, modal-free body:

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import ErrorBoundary from '../../shared/ErrorBoundary';
import ProblemVoteFlow from '../../collaboration/flows/voting/ProblemVoteFlow';
import StageGate from '../../community/StageGate';
import { Button } from '../../shared';
import { useT } from '../../../i18n';
import styles from './ProblemEngage.module.scss';

export interface ProblemEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates participation. */
  communityId: string;
  /** Active community member count, for the threshold copy. */
  communityMemberCount: number;
  /** Live "second" upvote count (read by the parent), for the threshold copy. */
  up: number;
  /** Host coordinates for the Discuss / Suggest deep links. */
  hostServer: string;
  hostAgent: string;
  /** Problem author — the recipient of "Send suggestion to author". */
  authorKey?: string;
  authorName?: string;
}

/**
 * The Problem stage's Engage slot inside the shared InitiativeStageCard. Flush
 * (no card-in-a-card): the "Is this a shared problem?" vote ({@link ProblemVoteFlow},
 * gated by {@link StageGate}) first, then a plain-language threshold line, then two
 * clear actions — Discuss this problem (threaded chat) and Send suggestion to
 * author (DM). Advancement is the shared-problem vote only; discussion is ungated.
 */
const ProblemEngage: React.FC<ProblemEngageProps> = ({
  initiativeId,
  communityId,
  communityMemberCount,
  up,
  hostServer,
  hostAgent,
  authorKey,
  authorName,
}) => {
  const t = useT();
  const navigate = useNavigate();

  const needed = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const thresholdMet = up >= needed;

  const base = `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}`;
  const openDiscussion = () => navigate(`${base}/discussion`);
  const openSuggest = () => navigate(`${base}/suggest`, { state: { authorKey, authorName } });

  return (
    <div className={styles.engage}>
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

      <p className={styles.thresholdHint}>
        {thresholdMet
          ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
          : t('problems.thresholdHintShort', 'It becomes a shared problem once at least half of your community agrees.')}
      </p>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={openDiscussion}>
          <MessageCircle size={16} aria-hidden /> {t('card.discussProblem', 'Discuss this problem')}
        </Button>
        <Button variant="secondary" onClick={openSuggest}>
          <Send size={16} aria-hidden /> {t('card.suggestToAuthor', 'Send suggestion to author')}
        </Button>
      </div>
    </div>
  );
};

export default ProblemEngage;
```

- [ ] **Step 3: Trim `ProblemEngage.module.scss`.** Replace the whole file with only the styles the new body uses (drop all form/modal/success/chip rules):

```scss
@use '../../../styles/variables' as *;

.engage {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* Plain-language threshold line, below the vote */
.thresholdHint {
  margin: 0;
  font-size: $text-xs;
  line-height: 1.5;
  color: $gray-500;

  @media (prefers-color-scheme: dark) {
    color: $dark-text-secondary;
  }
}

/* The two CTA buttons — wrap at 360px */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
```

- [ ] **Step 4: Pass author props from `ProblemActivityCard`.** In `ProblemActivityCard.tsx`, add `authorKey` + `authorName` to the `<ProblemEngage … />` call:

```tsx
      <ProblemEngage
        initiativeId={item.id}
        communityId={communityId}
        communityMemberCount={activeMemberCount}
        up={up}
        hostServer={hostServer}
        hostAgent={hostAgent}
        authorKey={authorKey}
        authorName={authorName}
      />
```

- [ ] **Step 5: Dormancy comment.** In `src/components/stages/ProblemStage.demo.ts`, add a one-line comment above the `proposeCandidateIssue` export:

```ts
// Reserved for Write Together (Session 3): the "propose a new framing/candidate
// issue" flow relocates there. No card calls this after S2 (the problem card's
// "Propose a different framing" became "Send suggestion to author").
export function proposeCandidateIssue(input: ProposeIssueInput): string {
```

- [ ] **Step 6: Type-check.** Run: `npm run build` — Expected: clean. Confirm no dangling imports remain in `ProblemEngage` (the old `Modal`/`SearchableSelect`/`COUNTRIES`/`SDG_OPTIONS`/`proposeCandidateIssue`/`sanitizeExternalUrl`/`Globe`/`Plus`/`Banner`/`useAppDispatch`/`useAppSelector`/`fetchCollaborations`/`TFunction` imports are all gone).
- [ ] **Step 7: Visual verify + expand-in-place audit.** Community page → a Problem-stage card. Screenshot 360px light + dark, collapsed and expanded. Confirm: the Engage body is **flush** (no inner card border/background); order = vote (heading + up/down + bar) → "agreed by half" line → two buttons; **Discuss this problem** opens the threaded page; **Send suggestion to author** opens the DM with the author's name in the header. Then audit Home + `/stage/*`: tapping a problem card **expands in place** (does not route to the community/initiative page). If any problem-card surface routes away on tap, fix it to use the card's expand toggle.
- [ ] **Step 8: Commit.**

```bash
git add src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss src/components/initiative/stages/ProblemEngage.tsx src/components/initiative/stages/ProblemEngage.module.scss src/components/community/ProblemActivityCard.tsx src/components/stages/ProblemStage.demo.ts
git commit -m "refactor(problem-card): de-box + reorder vote→threshold→two CTA buttons; framing modal → author DM"
```

---

## Task 7: i18n parity (new keys + reworded + prune orphaned)

Add the new strings to `fr.ts` + `sw.ts` at parity, reword the moved keys, and prune the orphaned category strings (grep-gated). English renders from inline defaults already.

**Files:**
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

- [ ] **Step 1: Add the new keys** to **both** `fr.ts` and `sw.ts` (place near related `deliberation.*` / `card.*` / a new `suggest.*` group). Use these values:

| key | fr | sw |
|---|---|---|
| `card.discussProblem` | Discuter de ce problème | Jadili tatizo hili |
| `card.suggestToAuthor` | Envoyer une suggestion à l’auteur | Tuma pendekezo kwa mwandishi |
| `problems.thresholdHintShort` | Cela devient un problème commun lorsqu’au moins la moitié de votre communauté est d’accord. | Inakuwa tatizo la pamoja pindi angalau nusu ya jamii yako inakubali. |
| `deliberation.thread.addPlaceholder` | Ajouter à la discussion… | Changia kwenye majadiliano… |
| `deliberation.thread.comment` | Commenter | Toa maoni |
| `deliberation.thread.reply` | Répondre | Jibu |
| `deliberation.thread.replyPlaceholder` | Répondre à {name}… | Mjibu {name}… |
| `deliberation.thread.delete` | Supprimer | Futa |
| `deliberation.thread.like` | J’aime | Penda |
| `deliberation.thread.expand` | Afficher les réponses | Onyesha majibu |
| `deliberation.thread.collapse` | Masquer les réponses | Ficha majibu |
| `deliberation.thread.sortLabel` | Trier les commentaires | Panga maoni |
| `deliberation.thread.sortTop` | Populaires | Maarufu |
| `deliberation.thread.sortNewest` | Récents | Mpya |
| `deliberation.thread.continue` | Continuer ce fil ({n}) → | Endelea na uzi huu ({n}) → |
| `deliberation.thread.back` | Retour à la discussion complète | Rudi kwenye majadiliano kamili |
| `deliberation.thread.emptyTitle` | Pas encore de commentaires | Hakuna maoni bado |
| `deliberation.thread.empty` | Lancez la conversation sur ce problème. | Anzisha mazungumzo kuhusu tatizo hili. |
| `deliberation.thread.count.one` | 1 commentaire | Maoni 1 |
| `deliberation.thread.count.many` | {n} commentaires | Maoni {n} |
| `deliberation.discussion.teaser` | {c} commentaires · {p} personnes | Maoni {c} · watu {p} |
| `suggest.eyebrow` | Suggestion | Pendekezo |
| `suggest.author` | l’auteur | mwandishi |
| `suggest.emptyTitle` | Envoyer une suggestion privée | Tuma pendekezo la faragha |
| `suggest.empty` | Votre suggestion est envoyée en privé à {name}. | Pendekezo lako litatumwa kwa faragha kwa {name}. |
| `suggest.placeholder` | Écrivez votre suggestion… | Andika pendekezo lako… |
| `suggest.send` | Envoyer la suggestion | Tuma pendekezo |

- [ ] **Step 2: Reword the moved keys** in **both** `fr.ts` and `sw.ts` (find the existing keys and replace their values):

| key | fr | sw |
|---|---|---|
| `deliberation.discussion.open` | Ouvrir la discussion | Fungua majadiliano |
| `deliberation.settingUp` | Préparation de la discussion… | Inaandaa majadiliano… |
| `deliberation.empty.body` | Soyez le premier à donner votre avis sur ce problème. | Kuwa wa kwanza kutoa maoni kuhusu tatizo hili. |

- [ ] **Step 3: Grep-gated prune.** For each candidate orphaned key, confirm **zero** references in `src` before deleting it from `fr.ts` + `sw.ts`. Run:

```bash
for k in discussionFlow.category.evidence discussionFlow.category.impact discussionFlow.category.solutions discussionFlow.category.concerns discussionFlow.filterAll discussionFlow.comment discussionFlow.reply discussionFlow.you discussionFlow.commentCount.one discussionFlow.commentCount.many discussionFlow.composePlaceholder discussionFlow.replyPlaceholder discussionFlow.empty discussionFlow.emptyFiltered discussionFlow.expand discussionFlow.collapse discussionFlow.delete discussionFlow.settingUp; do n=$(grep -rn "'$k'" src --include='*.tsx' --include='*.ts' | grep -v 'i18n/' | wc -l | tr -d ' '); echo "$k : $n refs in code"; done
```

Delete from `fr.ts` + `sw.ts` **only** the keys reporting `0 refs in code`. (The `problems.thresholdHint` long form, `problems.proposeFraming*`, `problems.field*`, `problems.propose*`, `card.discussThis` may also orphan — run the same check and prune those at `0 refs`. Keep `deliberation.meter.*` — `ParticipationMeter` is dormant but still references them.)

- [ ] **Step 4: Parity check.** Compare key sets — counts must match and the diff must be empty:

```bash
grep -oE "^\s*'[^']+'" src/i18n/fr.ts | tr -d " '" | sort > /tmp/fr.keys
grep -oE "^\s*'[^']+'" src/i18n/sw.ts | tr -d " '" | sort > /tmp/sw.keys
diff /tmp/fr.keys /tmp/sw.keys && echo "PARITY OK"
wc -l /tmp/fr.keys /tmp/sw.keys
```

Expected: `PARITY OK`, equal counts.

- [ ] **Step 5: Append to the native-review doc.** Add the new + reworded keys (Steps 1–2) under a dated "Session 2" heading in `docs/i18n-native-review-candidates.md`, noting they are best-effort machine drafts awaiting fr/sw native review.

- [ ] **Step 6: Type-check + visual.** `npm run build` clean. With `preview_*`, switch locale to fr then sw (the pre-auth `LanguageSwitcher`), open the threaded discussion + the DM + a problem card at 360px. Confirm no missing-key fallbacks (no raw English where fr/sw is expected) and no layout breakage.
- [ ] **Step 7: Commit.**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "i18n(session-2): fr/sw parity for thread/DM/CTA strings; reword discussion keys; prune orphaned category keys"
```

---

## Self-Review

**Spec coverage** (spec §4):
- §4.1 Problem card de-box + reorder + two CTAs → Task 6 (+ `ProblemVoteFlow` de-box, author props, dormancy). ✔
- §4.2 `ThreadedDiscussion` (hearts, Top/Newest, continue-thread) → Task 1 (data) + Task 2 (component). ✔
- §4.3 Discussion stage swap + `DiscussionEngage` teaser + collab flow + labels → Tasks 2, 3, 4. ✔
- §4.4 Author DM full page + route → Task 5. ✔
- §4.5 seam (`like_comment`; DM reuses chat; dormant code) → Tasks 1, 5, 6. ✔
- §4.6 expand-in-place audit → Task 6 Step 7. ✔
- §6 i18n parity + reword + prune → Task 7. ✔

**Placeholder scan:** No "TBD"/"handle the rest". Every code step shows the code; every edit names the file (and line ranges where surgical). The two new components are given in full.

**Type/name consistency:** `Comment.likes: string[]` (Task 1) is read in Task 2 (`node.likes`); `likeComment` (Task 1) is called in Task 2 (`api.likeComment`). `ThreadedDiscussionProps { contractId; communityId?; canParticipate; emptyHint? }` (Task 2) is consumed verbatim in Tasks 2 (stage) + 3 (collab). `DiscussionEngageProps { initiativeId }` (Task 4) matches the updated caller (Task 4 Step 3). `ProblemEngageProps` gains `authorKey?/authorName?` (Task 6) matching the `ProblemActivityCard` call (Task 6 Step 4) and the `/suggest` nav state read in `SuggestionDmView` (Task 5). `DM_TOPIC = 'dm'` is the single constant used by both `getMessages`/`addMessage`.

**Risks called out:** the continue-thread re-root (single-level "Back to full discussion" — documented simplification) and the demo DM being one-way (author is a seeded persona) — both noted in code comments and verified by screenshot.
