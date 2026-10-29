import { contractRead, contractWrite } from '../../../services/api';
import type { IMethod } from '../../../services/interfaces';

// ---------------------------------------------------------------------------
// Chat — on-chain topics and messages, shared across the community
// ---------------------------------------------------------------------------

export interface ChatTopic {
  id: string;
  title: string;
  author: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  topicId: string;
  author: string;
  text: string;
  timestamp: number;
}

interface RawTopic {
  id?: string;
  title?: string;
  author?: string;
  createdAt?: number | string;
  lastActivity?: number | string;
  messageCount?: number | string;
}

interface RawMessage {
  id?: string;
  topicId?: string;
  author?: string;
  text?: string;
  timestamp?: number | string;
}

function normalizeTimestamp(raw: number | string | undefined): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string' || !raw) return 0;

  // Gloki's `timestamp()` returns a packed digit string: YYYYMMDDHHMMSS + fractional digits.
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

  // Not a Gloki packed-digit timestamp — fall back to generic number/date parsing.
  // Warn so the next unexpected shape is loggable without rotting silently.
  console.warn('[chatApi] Unrecognized timestamp shape, falling back to generic parse:', raw);
  const parsed = Number(raw);
  if (!Number.isNaN(parsed)) return parsed;
  const asDate = Date.parse(raw);
  if (!Number.isNaN(asDate)) return asDate;
  return 0;
}

function normalizeCount(raw: number | string | undefined): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string' || !raw) return 0;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeTopic(raw: RawTopic): ChatTopic {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    author: String(raw.author ?? ''),
    createdAt: normalizeTimestamp(raw.createdAt),
    lastActivity: normalizeTimestamp(raw.lastActivity),
    messageCount: normalizeCount(raw.messageCount),
  };
}

function normalizeMessage(raw: RawMessage): ChatMessage {
  return {
    id: String(raw.id ?? ''),
    topicId: String(raw.topicId ?? ''),
    author: String(raw.author ?? ''),
    text: String(raw.text ?? ''),
    timestamp: normalizeTimestamp(raw.timestamp),
  };
}

export async function getTopics(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<ChatTopic[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_topics', values: {} } as IMethod,
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, RawTopic>;
  return Object.values(obj)
    .map(normalizeTopic)
    .filter((t) => t.id)
    .sort((a, b) => b.lastActivity - a.lastActivity);
}

export async function createTopic(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  title: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'create_topic', values: { title } } as IMethod,
  });
}

export async function getMessages(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  topicId: string,
): Promise<ChatMessage[]> {
  const raw = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_messages', values: { topic_id: topicId } } as IMethod,
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, RawMessage>;
  return Object.values(obj)
    .map(normalizeMessage)
    .filter((m) => m.id)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function addMessage(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  topicId: string,
  text: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_message', values: { topic_id: topicId, text } } as IMethod,
  });
}
