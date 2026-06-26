import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

export type CommentCategory = 'evidence' | 'impact' | 'solutions' | 'concerns';

export interface Comment {
  id: string;
  author: string;
  text: string;
  parentId: string | null;
  timestamp: number;
  category?: CommentCategory;
  deleted?: boolean;
  likes: string[];
}

interface RawComment {
  id?: string;
  author?: string;
  text?: string;
  parentId?: string | null;
  timestamp?: number | string;
  category?: CommentCategory | '' | null;
  deleted?: boolean;
  likes?: unknown;
}

function normalizeTimestamp(raw: number | string | undefined): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string' || !raw) return 0;

  // Gloki's `timestamp()` returns a packed digit string: YYYYMMDDHHMMSS + fractional digits.
  // Parse to a JS epoch ms if we can, else fall through.
  if (/^\d{14,}$/.test(raw)) {
    const year = parseInt(raw.slice(0, 4), 10);
    const month = parseInt(raw.slice(4, 6), 10) - 1;
    const day = parseInt(raw.slice(6, 8), 10);
    const hour = parseInt(raw.slice(8, 10), 10);
    const minute = parseInt(raw.slice(10, 12), 10);
    const second = parseInt(raw.slice(12, 14), 10);
    const fractional = raw.slice(14);
    const millis = fractional ? Math.floor(parseInt(fractional.padEnd(6, '0').slice(0, 6), 10) / 1000) : 0;
    const ms = Date.UTC(year, month, day, hour, minute, second, millis);
    if (!Number.isNaN(ms)) return ms;
  }

  const parsed = Number(raw);
  if (!Number.isNaN(parsed)) return parsed;
  const asDate = Date.parse(raw);
  if (!Number.isNaN(asDate)) return asDate;
  return 0;
}

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

export async function addComment(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  text: string,
  parentId: string | null,
  category?: CommentCategory,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'add_comment',
      values: {
        text,
        parent_id: parentId ?? '',
        category: category ?? '',
      },
    } as IMethod,
  });
}

export async function deleteComment(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  commentId: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'delete_comment',
      values: { comment_id: commentId },
    } as IMethod,
  });
}

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

export async function getComments(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Comment[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_comments', values: {} } as IMethod,
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, RawComment>;
  return Object.values(obj).map(normalizeComment);
}

// ===========================================================================
// Co-authoring group (Stage 2 redesign — Batch 5)
//
// The deliberation surface as one co-authoring space: a co-owned `Statement`,
// track-changes `EditSuggestion`s, country-tagged `Position`s, and anchored
// discussion. One person, one vote — every support call appends the caller's pk
// (deduped in the contract). Country is resolved CLIENT-SIDE from the author's
// profile (the contract stores only the author pk), so it isn't modelled here.
// ===========================================================================

export type PositionType = CommentCategory; // 'evidence' | 'impact' | 'solutions' | 'concerns'

export interface Statement {
  title: string;
  body: string;
  coAuthors: string[]; // pks credited on the statement
}

export interface EditSuggestion {
  id: string;
  field: 'title' | 'body';
  author: string; // pk
  baseText: string; // text this edit was drafted against (for the diff)
  text: string; // proposed replacement
  rationale: string;
  supporters: string[]; // pks — 1p1v
  status: 'open' | 'accepted' | 'stale';
  createdAgo: number; // minutes (feeds relativeTimeKey); 0 = just now
}

export interface Position {
  id: string;
  type: PositionType;
  author: string; // pk
  text: string;
  supporters: string[]; // pks — 1p1v
  replyCount: number; // derived by the contract from anchored under this position
  createdAgo: number;
}

export interface AnchoredComment {
  id: string;
  anchor: string; // 'statement' | positionId
  author: string; // pk
  text: string;
  parentId: string | null;
  createdAgo: number;
}

const POSITION_TYPES: PositionType[] = ['evidence', 'impact', 'solutions', 'concerns'];

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

/** Tolerate either an array (mock) or a dict (a real `Storage()` map). */
function toList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') return Object.values(raw as Record<string, Record<string, unknown>>);
  return [];
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatement(raw: unknown): Statement {
  const o = asObject(raw);
  return { title: String(o.title ?? ''), body: String(o.body ?? ''), coAuthors: strArr(o.coAuthors) };
}

function normalizeEdit(raw: Record<string, unknown>): EditSuggestion {
  const status = raw.status === 'accepted' || raw.status === 'stale' ? raw.status : 'open';
  return {
    id: String(raw.id ?? ''),
    field: raw.field === 'title' ? 'title' : 'body',
    author: String(raw.author ?? ''),
    baseText: String(raw.baseText ?? ''),
    text: String(raw.text ?? ''),
    rationale: String(raw.rationale ?? ''),
    supporters: strArr(raw.supporters),
    status,
    createdAgo: num(raw.createdAgo),
  };
}

function normalizePosition(raw: Record<string, unknown>): Position {
  const type = POSITION_TYPES.includes(raw.type as PositionType) ? (raw.type as PositionType) : 'solutions';
  return {
    id: String(raw.id ?? ''),
    type,
    author: String(raw.author ?? ''),
    text: String(raw.text ?? ''),
    supporters: strArr(raw.supporters),
    replyCount: num(raw.replyCount),
    createdAgo: num(raw.createdAgo),
  };
}

function normalizeAnchored(raw: Record<string, unknown>): AnchoredComment {
  return {
    id: String(raw.id ?? ''),
    anchor: String(raw.anchor ?? ''),
    author: String(raw.author ?? ''),
    text: String(raw.text ?? ''),
    parentId: raw.parentId ? String(raw.parentId) : null,
    createdAgo: num(raw.createdAgo),
  };
}

// --- shared statement ---
export async function getStatement(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Statement> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_statement', values: {} } as IMethod,
  });
  return normalizeStatement(raw);
}

export async function setStatement(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  title: string,
  body: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'set_statement', values: { title, body } } as IMethod,
  });
}

export async function getEdits(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<EditSuggestion[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_edits', values: {} } as IMethod,
  });
  return toList(raw).map(normalizeEdit);
}

export async function suggestEdit(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  field: 'title' | 'body',
  text: string,
  rationale: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'suggest_edit', values: { field, text, rationale } } as IMethod,
  });
}

export async function supportEdit(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  editId: string,
  target: number,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'support_edit', values: { edit_id: editId, target } } as IMethod,
  });
}

export async function withdrawEditSupport(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  editId: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'withdraw_edit_support', values: { edit_id: editId } } as IMethod,
  });
}

// --- positions ---
export async function getPositions(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Position[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_positions', values: {} } as IMethod,
  });
  return toList(raw).map(normalizePosition);
}

export async function addPosition(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  type: PositionType,
  text: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_position', values: { type, text } } as IMethod,
  });
}

export async function supportPosition(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  positionId: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'support_position', values: { position_id: positionId } } as IMethod,
  });
}

export async function withdrawPositionSupport(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  positionId: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'withdraw_position_support', values: { position_id: positionId } } as IMethod,
  });
}

// --- anchored discussion ---
export async function getAnchoredComments(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  anchor: string,
): Promise<AnchoredComment[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_anchored_comments', values: { anchor } } as IMethod,
  });
  return toList(raw).map(normalizeAnchored);
}

export async function addAnchoredComment(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  anchor: string,
  text: string,
  parentId: string | null,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_anchored_comment', values: { anchor, text, parent_id: parentId ?? '' } } as IMethod,
  });
}
