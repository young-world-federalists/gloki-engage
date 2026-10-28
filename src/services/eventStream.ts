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
  /** The signed-in identity's own stream, as passed to connect(). */
  private ownServer: string | null = null;
  private ownAgent: string | null = null;
  /**
   * Contracts used without joining them (contractHosts.ts): their write
   * events only appear on the HOST agent's stream, so each host node gets one
   * extra connection covering every (agent, contract) pair watched there.
   */
  private watched: Map<string, { pairs: Set<string>; source: EventSource | null }> = new Map();

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
    // Watched host streams belong to the signed-in identity; drop them when it changes.
    if (serverUrl !== this.ownServer || agent !== this.ownAgent) this.unwatchAll();
    this.ownServer = serverUrl;
    this.ownAgent = agent;

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

    this.eventSource.onmessage = (event) => this.dispatch(event.data);

    this.eventSource.onerror = () => {
      // console.error('SSE connection error');
      this.handleConnectionError();
    };
  }

  /** Parses one SSE message and notifies the listeners for its action. */
  private dispatch(raw: string) {
    if (!raw || raw.trim() === '') return;
    let data: BlockchainEvent;
    try {
      data = JSON.parse(raw) as BlockchainEvent;
    } catch {
      return;
    }
    if (!data.action) return;
    const listeners = this.listeners.get(data.action as EventType);
    listeners?.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // a failing listener must not stop the others
      }
    });
  }

  /**
   * Follows a contract's events on its host's stream (a contract read and
   * written through its host without joining it). Its events then reach the
   * same listeners as the user's own stream. No-op for the user's own agent.
   */
  watchContract(server: string, agent: string, contract: string) {
    if (server === this.ownServer && agent === this.ownAgent) return;
    const pair = `${agent}\n${contract}`;
    const entry = this.watched.get(server) ?? { pairs: new Set<string>(), source: null };
    if (entry.pairs.has(pair)) return;
    entry.pairs.add(pair);
    this.watched.set(server, entry);
    // One connection per host node; reopen it with the full pair list.
    entry.source?.close();
    const query = [...entry.pairs]
      .map((p) => {
        const [a, c] = p.split('\n');
        return `agent=${encodeURIComponent(a)}&contract=${encodeURIComponent(c)}`;
      })
      .join('&');
    try {
      entry.source = new EventSource(`${server}/stream?${query}`);
      entry.source.onmessage = (event) => this.dispatch(event.data);
    } catch {
      entry.source = null;
    }
  }

  /** Closes every host stream opened by watchContract. */
  unwatchAll() {
    for (const entry of this.watched.values()) entry.source?.close();
    this.watched.clear();
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
/**
 * A short-lived stream for writes made as ANOTHER identity than the signed-in
 * user (e.g. the application agent, src/services/verificationRegistry.ts):
 * their acks arrive on that identity's stream, possibly on another node, so
 * the shared `eventStreamService` connection never sees them. Resolves once
 * the stream is open, so a write issued afterwards can't race it; buffers by
 * request id like `watchForChainAck`. `contract` scopes it ('' = every event
 * of `agent`, needed for a deploy). Always `dispose()` — it closes the stream.
 */
export function openScopedAckStream(
  serverUrl: string,
  agent: string,
  contract = '',
  openTimeoutMs = 10000,
): Promise<ChainAckWatcher> {
  const buffered = new Map<string, unknown>();
  const pending = new Map<string, { resolve: (reply: unknown) => void; timeoutId: ReturnType<typeof setTimeout> }>();
  const source = new EventSource(
    `${serverUrl}/stream?agent=${encodeURIComponent(agent)}&contract=${encodeURIComponent(contract)}`,
  );

  source.onmessage = (event) => {
    if (!event.data || event.data.trim() === '') return;
    let data: BlockchainEvent;
    try {
      data = JSON.parse(event.data) as BlockchainEvent;
    } catch {
      return;
    }
    const requestId = data.request as string | undefined;
    if (!requestId) return;
    const waiter = pending.get(requestId);
    if (waiter) {
      clearTimeout(waiter.timeoutId);
      pending.delete(requestId);
      waiter.resolve(data.reply);
    } else {
      buffered.set(requestId, data.reply);
    }
  };

  const watcher: ChainAckWatcher = {
    waitFor(requestId: string, timeoutMs = 20000): Promise<unknown> {
      if (buffered.has(requestId)) {
        const reply = buffered.get(requestId);
        buffered.delete(requestId);
        return Promise.resolve(reply);
      }
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`Timed out waiting for the result of request ${requestId}`));
        }, timeoutMs);
        pending.set(requestId, { resolve, timeoutId });
      });
    },
    dispose() {
      source.close();
      for (const waiter of pending.values()) clearTimeout(waiter.timeoutId);
      pending.clear();
      buffered.clear();
    },
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      watcher.dispose();
      reject(new Error('Could not connect to the application server.'));
    }, openTimeoutMs);
    source.onopen = () => {
      clearTimeout(timeoutId);
      resolve(watcher);
    };
  });
}

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
