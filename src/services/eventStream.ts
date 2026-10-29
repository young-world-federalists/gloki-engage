export interface BlockchainEvent {
  action: 'contract_write' | 'deploy_contract' | 'a2a_connect' | string;
  contract?: string;
  [key: string]: unknown;
}

export type EventListener = (event: BlockchainEvent) => void;

export type EventType = 'contract_write' | 'deploy_contract' | 'a2a_connect';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
/** 1 + 2 + 4 + 8 + 16 + 30 + 30 + 30 s: about two minutes of trying. */
const MAX_RECONNECT_ATTEMPTS = 8;
/** A connection that lasted this long counts as healthy: the next drop starts a fresh round. */
const HEALTHY_CONNECTION_MS = 60_000;

/**
 * One SSE connection that reopens itself after a failure, with exponential
 * backoff and a cap. The browser's own EventSource retry is not used: it
 * retries every few seconds forever, even with no network. Offline, no
 * attempts are spent; `resume()` (called when the browser comes back online
 * or the tab is shown again) starts a fresh round after the cap was reached.
 */
class ReconnectingStream {
  private source: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private openedAt: number | null = null;
  private closed = false;
  private readonly url: string;
  private readonly onMessage: (data: string) => void;
  private readonly onStatus?: (open: boolean) => void;

  constructor(url: string, onMessage: (data: string) => void, onStatus?: (open: boolean) => void) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.open();
  }

  private open() {
    try {
      const source = new EventSource(this.url);
      this.source = source;
      source.onopen = () => {
        this.openedAt = Date.now();
        this.onStatus?.(true);
      };
      source.onmessage = (event) => this.onMessage(event.data);
      source.onerror = () => {
        // Not on open: a server that accepts and drops at once must still hit the cap.
        if (this.openedAt !== null && Date.now() - this.openedAt >= HEALTHY_CONNECTION_MS) this.attempts = 0;
        this.openedAt = null;
        source.close();
        this.source = null;
        this.onStatus?.(false);
        this.scheduleRetry();
      };
    } catch {
      this.source = null;
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.closed || this.retryTimer) return;
    if (!navigator.onLine) return; // resume() reopens once the browser is back online
    if (this.attempts >= MAX_RECONNECT_ATTEMPTS) return; // until resume()
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.attempts, RECONNECT_MAX_MS);
    this.attempts++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.open();
    }, delay);
  }

  /** Reopens a stream that is down and not already waiting to retry. */
  resume() {
    if (this.closed || this.source || this.retryTimer) return;
    this.attempts = 0;
    this.open();
  }

  close() {
    this.closed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.source?.close();
    this.source = null;
  }
}

class EventStreamService {
  private stream: ReconnectingStream | null = null;
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private isConnected = false;
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();
  /** The signed-in identity's own stream, as passed to connect(). */
  private ownServer: string | null = null;
  private ownAgent: string | null = null;
  /**
   * Contracts used without joining them (contractHosts.ts): their write
   * events only appear on the HOST agent's stream, so each host node gets one
   * extra connection covering every (agent, contract) pair watched there.
   */
  private watched: Map<string, { pairs: Set<string>; stream: ReconnectingStream | null }> = new Map();

  constructor() {
    if (typeof window === 'undefined') return;
    const resumeAll = () => {
      this.stream?.resume();
      for (const entry of this.watched.values()) entry.stream?.resume();
    };
    window.addEventListener('online', resumeAll);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') resumeAll();
    });
  }

  private setConnected(connected: boolean) {
    if (connected === this.isConnected) return;
    this.isConnected = connected;
    this.connectionListeners.forEach(listener => {
      try {
        listener(this.isConnected);
      } catch {
        // a failing listener must not stop the others
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
    this.disconnect();
    // Watched host streams belong to the signed-in identity; drop them when it changes.
    if (serverUrl !== this.ownServer || agent !== this.ownAgent) this.unwatchAll();
    this.ownServer = serverUrl;
    this.ownAgent = agent;
    this.stream = new ReconnectingStream(
      `${serverUrl}/stream?agent=${agent}&contract=`,
      (data) => this.dispatch(data),
      (open) => this.setConnected(open),
    );
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
    const entry = this.watched.get(server) ?? { pairs: new Set<string>(), stream: null };
    if (entry.pairs.has(pair)) return;
    entry.pairs.add(pair);
    this.watched.set(server, entry);
    // One connection per host node; reopen it with the full pair list.
    entry.stream?.close();
    const query = [...entry.pairs]
      .map((p) => {
        const [a, c] = p.split('\n');
        return `agent=${encodeURIComponent(a)}&contract=${encodeURIComponent(c)}`;
      })
      .join('&');
    entry.stream = new ReconnectingStream(`${server}/stream?${query}`, (data) => this.dispatch(data));
  }

  /** Closes every host stream opened by watchContract. */
  unwatchAll() {
    for (const entry of this.watched.values()) entry.stream?.close();
    this.watched.clear();
  }

  disconnect() {
    this.stream?.close();
    this.stream = null;
    this.setConnected(false);
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
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
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
