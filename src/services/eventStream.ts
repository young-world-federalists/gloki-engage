export interface BlockchainEvent {
  action: 'contract_write' | 'deploy_contract' | 'a2a_connect' | string;
  contract?: string;
  [key: string]: unknown;
}

export type EventListener = (event: BlockchainEvent) => void;

export type EventType = 'contract_write' | 'deploy_contract' | 'a2a_connect';

class EventStreamService {
  private eventSource: EventSource | null = null;
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();

  private notifyConnectionListeners() {
    this.connectionListeners.forEach(listener => {
      try {
        listener(this.isConnected);
      } catch (e) {
        // console.error('Error in connection status listener:', e);
      }
    });
  }

  addConnectionListener(listener: (isConnected: boolean) => void) {
    this.connectionListeners.add(listener);
  }

  removeConnectionListener(listener: (isConnected: boolean) => void) {
    this.connectionListeners.delete(listener);
  }

  connect(serverUrl: string, agent: string) {
    if (this.eventSource) {
      this.disconnect();
    }

    const streamUrl = `${serverUrl}/stream?agent=${agent}&contract=`;
    // console.log('Connecting to SSE stream:', streamUrl);

    try {
      this.eventSource = new EventSource(streamUrl);
      this.setupEventHandlers();
    } catch (error) {
      // console.error('Failed to create EventSource:', error);
      this.handleConnectionError();
    }
  }

  private setupEventHandlers() {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      // console.log('SSE connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners();
    };

    this.eventSource.onmessage = (event) => {
      if (!event.data || event.data.trim() === "") {
        // console.warn("Received empty SSE event data, skipping parse.");
        return;
      }
      try {
        const data = JSON.parse(event.data) as BlockchainEvent;
        // console.log('SSE Event received:', data);
        
        // Notify listeners based on action type
        if (data.action) {
          const listeners = this.listeners.get(data.action as EventType);
          if (listeners) {
            // console.log(`Notifying ${listeners.size} listeners for action: ${data.action}`);
            listeners.forEach(listener => {
              try {
                listener(data);
              } catch (error) {
                // console.error('Error in event listener:', error);
              }
            });
          } else {
            // console.log(`No listeners registered for action: ${data.action}`);
          }
        }
      } catch (error) {
        // console.error('Failed to parse SSE event data:', error, 'Raw data:', event.data);
      }
    };

    this.eventSource.onerror = () => {
      // console.error('SSE connection error');
      this.handleConnectionError();
    };
  }

  private handleConnectionError() {
    this.isConnected = false;
    this.notifyConnectionListeners();
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Note: Reconnection logic would need to be implemented here
        // For now, we'll just log the error
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      // console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.eventSource) {
      // console.log('Disconnecting from SSE stream');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners();
    this.reconnectAttempts = 0;
  }

  addEventListener(eventType: EventType, listener: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  removeEventListener(eventType: EventType, listener: EventListener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      // console.log(`Event listener removed for: ${eventType}. Remaining listeners: ${listeners.size}`);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
        // console.log(`No more listeners for: ${eventType}, removed from registry`);
      }
    }
  }

  isConnectedToStream(): boolean {
    return this.isConnected;
  }
}

// Export a singleton instance
export const eventStreamService = new EventStreamService();

export interface ChainAckWatcher {
  /**
   * Resolves with the matching event's `reply`. If the event already
   * arrived (buffered before this was called), resolves immediately;
   * otherwise waits up to `timeoutMs`.
   */
  waitFor(requestId: string, timeoutMs?: number): Promise<unknown>;
  /** Stops listening and drops any unclaimed buffered events. */
  dispose(): void;
}

/**
 * Starts listening for `deploy_contract`/`contract_write` events *now* —
 * call this BEFORE issuing the deploy/write PUT/POST, not after. A simple
 * write can complete and emit its SSE event within the same tick the HTTP
 * response returns; if the listener is only attached after that response
 * (i.e. after you already know the ack id), the event can arrive and be
 * missed before anything is listening for it, and waitFor() would hang
 * until it times out even though the write actually succeeded. Starting
 * the watcher first and buffering by request id closes that race — matched
 * by `request` === the ack id the PUT/POST call returned (writes only hand
 * back an ack id; the actual result is async, delivered here — see
 * docs/blockchain-api.md).
 *
 * One watcher can serve multiple sequential calls of the same event type
 * (e.g. two contract_write calls in a row) — just call waitFor() again with
 * the next ack id, and dispose() once when the whole flow is done.
 */
export function watchForChainAck(eventType: 'deploy_contract' | 'contract_write'): ChainAckWatcher {
  const buffered = new Map<string, unknown>();
  const pending = new Map<string, { resolve: (reply: unknown) => void; timeoutId: ReturnType<typeof setTimeout> }>();

  function handler(event: BlockchainEvent) {
    const requestId = event.request as string | undefined;
    if (!requestId) return;
    const waiter = pending.get(requestId);
    if (waiter) {
      clearTimeout(waiter.timeoutId);
      pending.delete(requestId);
      waiter.resolve(event.reply);
    } else {
      buffered.set(requestId, event.reply);
    }
  }

  eventStreamService.addEventListener(eventType, handler);

  return {
    waitFor(requestId: string, timeoutMs = 20000): Promise<unknown> {
      if (buffered.has(requestId)) {
        const reply = buffered.get(requestId);
        buffered.delete(requestId);
        return Promise.resolve(reply);
      }
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`Timed out waiting for ${eventType} result (request ${requestId})`));
        }, timeoutMs);
        pending.set(requestId, { resolve, timeoutId });
      });
    },
    dispose() {
      eventStreamService.removeEventListener(eventType, handler);
      for (const waiter of pending.values()) clearTimeout(waiter.timeoutId);
      pending.clear();
      buffered.clear();
    },
  };
}
