// The events of the contracts the signed-in user holds, from their node's
// stream (services/ibc.ts), by action. Pages subscribe here to refresh on
// anyone's writes; a contract read only through its host's public copy sends
// no events.
import { onEvent, type IbcEvent } from './ibc';

export type BlockchainEvent = IbcEvent;

export type EventListener = (event: BlockchainEvent) => void;

export type EventType = 'contract_write' | 'deploy_contract' | 'join_contract';

class EventStreamService {
  private listeners: Map<EventType, Set<EventListener>> = new Map();

  constructor() {
    onEvent((event) => {
      this.listeners.get(event.action as EventType)?.forEach((listener) => {
        try {
          listener(event);
        } catch {
          // a failing listener must not stop the others
        }
      });
    });
  }

  addEventListener(eventType: EventType, listener: EventListener) {
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set());
    this.listeners.get(eventType)!.add(listener);
  }

  removeEventListener(eventType: EventType, listener: EventListener) {
    this.listeners.get(eventType)?.delete(listener);
  }
}

export const eventStreamService = new EventStreamService();
