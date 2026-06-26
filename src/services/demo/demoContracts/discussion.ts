// Mock discussion_contract.py — the Stage 2 co-authoring space.
//
// Legacy threaded comments (add/get/delete_comment) back the collab
// DiscussionFlow and stay UNTOUCHED. The co-authoring group — a co-owned
// statement, track-changes edits, ranked positions, and anchored discussion —
// backs the redesigned Stage 2 surface and self-seeds from the deliberation
// fixture so any discussion sub-contract opens with the rich demo (today's
// contract-backed flow starts empty; the redesigned surface needs the seed to
// feel alive). Documented as mock seeding.
//
// ONE PERSON, ONE VOTE: every support action appends the caller's pk with
// dedup — never a weight. Eligibility is gated in the UI by StageGate.
import type { IMethod } from '../../interfaces';
import { readState, writeState, updateState } from '../demoState';
import type { DiscussionSeed } from '../fixtures/deliberation';

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

type PositionType = 'evidence' | 'impact' | 'solutions' | 'concerns';
const POSITION_TYPES: PositionType[] = ['evidence', 'impact', 'solutions', 'concerns'];

interface Statement {
  title: string;
  body: string;
  coAuthors: string[];
}
interface StoredEdit {
  id: string;
  field: 'title' | 'body';
  author: string;
  baseText: string;
  text: string;
  rationale: string;
  supporters: string[];
  status: 'open' | 'accepted' | 'stale';
  createdAgo: number;
}
interface StoredPosition {
  id: string;
  type: PositionType;
  author: string;
  text: string;
  supporters: string[];
  createdAgo: number;
}
interface StoredAnchored {
  id: string;
  anchor: string; // 'statement' | positionId
  author: string;
  text: string;
  parentId: string | null;
  createdAgo: number;
}

interface DiscussionState {
  comments: DiscussionComment[];
  statement: Statement;
  edits: Record<string, StoredEdit>;
  positions: Record<string, StoredPosition>;
  anchored: Record<string, StoredAnchored>;
}

function byId<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const it of items) out[it.id] = { ...it };
  return out;
}

// A fresh discussion sub-contract opens EMPTY. Only the showcase initiative is
// pre-seeded with the rich co-authoring demo — at seed time, via initDiscussion
// (see seedDemoCommunity.ts). Every other initiative's discussion deploys its
// own contract whose default is this blank state, so each initiative shows its
// OWN discussion rather than a shared misinformation seed (Unit 5 fix).
function defaultState(): DiscussionState {
  return {
    comments: [],
    statement: { title: '', body: '', coAuthors: [] },
    edits: {},
    positions: {},
    anchored: {},
  };
}

/**
 * Write the rich co-authoring seed into a specific discussion sub-contract.
 * Called once at seed time for the showcase initiative; `useFlowContract` then
 * JOINs that stored contract and reads the seeded state back. Demo-only (mock
 * write through `writeState` — no real server call).
 */
export function initDiscussion(contractId: string, seed: DiscussionSeed): void {
  writeState<DiscussionState>(contractId, {
    comments: [],
    statement: { ...seed.statement, coAuthors: [...seed.statement.coAuthors] },
    edits: byId(seed.edits),
    positions: byId(seed.positions),
    anchored: byId(seed.anchored),
  });
}

function load(contractId: string): DiscussionState {
  return { ...defaultState(), ...readState<Partial<DiscussionState>>(contractId) };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function dedupPush(list: string[], pk: string): string[] {
  return list.includes(pk) ? list : [...list, pk];
}

export function discussionRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_comments':
      return s.comments;
    case 'get_participant_count':
      return new Set(s.comments.filter((c) => !c.deleted).map((c) => c.author)).size;
    case 'get_summary':
      return {
        participants: new Set(s.comments.filter((c) => !c.deleted).map((c) => c.author)).size,
        commentCount: s.comments.filter((c) => !c.deleted).length,
      };

    // --- co-authoring group ---
    case 'get_statement':
      return s.statement;
    case 'get_edits':
      return Object.values(s.edits);
    case 'get_positions':
      // replyCount is DERIVED from anchored under each position.
      return Object.values(s.positions).map((p) => ({
        ...p,
        replyCount: Object.values(s.anchored).filter((a) => a.anchor === p.id).length,
      }));
    case 'get_anchored_comments': {
      const anchor = str(method.values?.anchor);
      return Object.values(s.anchored).filter((a) => a.anchor === anchor);
    }
    default:
      return null;
  }
}

export function discussionWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    // --- legacy threaded comments (untouched) ---
    case 'add_comment': {
      const text = method.values?.text as string | undefined;
      if (!text) return null;
      const comment: DiscussionComment = {
        id: newId(),
        author: caller,
        text,
        parentId: (method.values?.parentId as string | null | undefined) ?? null,
        timestamp: Date.now(),
        category: method.values?.category as DiscussionComment['category'],
        likes: [],
      };
      updateState<DiscussionState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        comments: [...(s.comments ?? []), comment],
      }));
      return comment;
    }
    case 'delete_comment': {
      const id = method.values?.comment_id as string | undefined; // API sends comment_id (matches edit_id/position_id convention)
      if (!id) return null;
      updateState<DiscussionState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        comments: (s.comments ?? []).map((c) =>
          c.id === id && c.author === caller ? { ...c, deleted: true, text: '' } : c,
        ),
      }));
      return null;
    }
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

    // --- co-authoring: shared statement ---
    case 'suggest_edit': {
      const field: 'title' | 'body' = method.values?.field === 'title' ? 'title' : 'body';
      const text = str(method.values?.text);
      if (!text) return null;
      const s = load(contractId);
      const edit: StoredEdit = {
        id: newId(),
        field,
        author: caller,
        baseText: field === 'title' ? s.statement.title : s.statement.body,
        text,
        rationale: str(method.values?.rationale),
        supporters: [caller],
        status: 'open',
        createdAgo: 0,
      };
      writeState<DiscussionState>(contractId, { ...s, edits: { ...s.edits, [edit.id]: edit } });
      return edit;
    }
    case 'support_edit': {
      // 1p1v + fold-in. `target` is passed by the UI (a majority of those who've
      // taken part, floor 3) so the rule is server-portable.
      const editId = str(method.values?.edit_id);
      const target = Math.max(3, Number(method.values?.target) || 3);
      const s = load(contractId);
      const e = s.edits[editId];
      if (!e || e.status !== 'open') return s.statement;
      const supporters = dedupPush(e.supporters, caller);
      let statement = s.statement;
      const edits: Record<string, StoredEdit> = { ...s.edits, [editId]: { ...e, supporters } };
      if (supporters.length >= target) {
        statement = {
          ...s.statement,
          [e.field]: e.text,
          coAuthors: dedupPush(s.statement.coAuthors, e.author),
        };
        edits[editId] = { ...e, supporters, status: 'accepted' };
        // Most-supported wins; sibling open edits to the same field go stale
        // (they need reworking against the new text). Documented simplification.
        for (const o of Object.values(edits)) {
          if (o.id !== editId && o.field === e.field && o.status === 'open') {
            edits[o.id] = { ...o, status: 'stale' };
          }
        }
      }
      writeState<DiscussionState>(contractId, { ...s, statement, edits });
      return statement;
    }
    case 'withdraw_edit_support': {
      const editId = str(method.values?.edit_id);
      const s = load(contractId);
      const e = s.edits[editId];
      if (!e || e.status !== 'open') return null;
      const supporters = e.supporters.filter((pk) => pk !== caller);
      writeState<DiscussionState>(contractId, { ...s, edits: { ...s.edits, [editId]: { ...e, supporters } } });
      return null;
    }

    // --- co-authoring: positions ---
    case 'add_position': {
      const rawType = str(method.values?.type) as PositionType;
      const type: PositionType = POSITION_TYPES.includes(rawType) ? rawType : 'solutions';
      const text = str(method.values?.text);
      if (!text) return null;
      const s = load(contractId);
      const position: StoredPosition = {
        id: newId(),
        type,
        author: caller,
        text,
        supporters: [caller],
        createdAgo: 0,
      };
      writeState<DiscussionState>(contractId, { ...s, positions: { ...s.positions, [position.id]: position } });
      return position;
    }
    case 'support_position': {
      const id = str(method.values?.position_id);
      const s = load(contractId);
      const p = s.positions[id];
      if (!p) return null;
      const supporters = dedupPush(p.supporters, caller);
      writeState<DiscussionState>(contractId, { ...s, positions: { ...s.positions, [id]: { ...p, supporters } } });
      return null;
    }
    case 'withdraw_position_support': {
      const id = str(method.values?.position_id);
      const s = load(contractId);
      const p = s.positions[id];
      if (!p) return null;
      const supporters = p.supporters.filter((pk) => pk !== caller);
      writeState<DiscussionState>(contractId, { ...s, positions: { ...s.positions, [id]: { ...p, supporters } } });
      return null;
    }

    // --- co-authoring: anchored discussion ---
    case 'add_anchored_comment': {
      const anchor = str(method.values?.anchor);
      const text = str(method.values?.text);
      if (!anchor || !text) return null;
      const s = load(contractId);
      const parentRaw = str(method.values?.parent_id);
      const comment: StoredAnchored = {
        id: newId(),
        anchor,
        author: caller,
        text,
        parentId: parentRaw || null,
        createdAgo: 0,
      };
      writeState<DiscussionState>(contractId, { ...s, anchored: { ...s.anchored, [comment.id]: comment } });
      return comment;
    }

    default:
      return null;
  }
}
