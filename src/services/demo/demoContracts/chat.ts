// Mock chat_contract.py — community chat topics + messages, timestamp-keyed.
import type { IMethod } from '../../interfaces';
import { readState, updateState } from '../demoState';

interface ChatTopic {
  id: string;
  title: string;
  author: string;
  createdAt: number;
}

interface ChatMessage {
  id: string;
  topicId: string;
  author: string;
  text: string;
  timestamp: number;
}

interface ChatState {
  topics: ChatTopic[];
  messages: ChatMessage[];
}

function defaultState(): ChatState {
  return { topics: [], messages: [] };
}

function load(contractId: string): ChatState {
  return { ...defaultState(), ...readState<Partial<ChatState>>(contractId) };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

export function chatRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_topics':
      return s.topics;
    case 'get_messages': {
      const topicId = method.values?.topic_id as string | undefined;
      return topicId ? s.messages.filter((m) => m.topicId === topicId) : s.messages;
    }
    default:
      return null;
  }
}

export function chatWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'create_topic': {
      const title = method.values?.title as string | undefined;
      if (!title) return null;
      const topic: ChatTopic = {
        id: newId(),
        title,
        author: caller,
        createdAt: Date.now(),
      };
      updateState<ChatState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        topics: [...(s.topics ?? []), topic],
      }));
      return topic;
    }
    case 'add_message': {
      const topicId = method.values?.topic_id as string | undefined;
      const text = method.values?.text as string | undefined;
      if (!topicId || !text) return null;
      const msg: ChatMessage = {
        id: newId(),
        topicId,
        author: caller,
        text,
        timestamp: Date.now(),
      };
      updateState<ChatState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        messages: [...(s.messages ?? []), msg],
      }));
      return msg;
    }
    default:
      return null;
  }
}
