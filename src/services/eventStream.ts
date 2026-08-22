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

/**
 * Resolves with a `deploy_contract`/`contract_write` call's real result once
 * the matching event arrives on the stream (matched by `request` === the ack
 * id the PUT/POST call returned). Per docs/blockchain-api.md: writes only
 * hand back an ack id — the actual result is async, delivered here.
 */
export function waitForChainAck(
  eventType: 'deploy_contract' | 'contract_write',
  requestId: string,
  timeoutMs = 20000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      eventStreamService.removeEventListener(eventType, handler);
      reject(new Error(`Timed out waiting for ${eventType} result (request ${requestId})`));
    }, timeoutMs);

    function handler(event: BlockchainEvent) {
      if (event.request !== requestId) return;
      clearTimeout(timeoutId);
      eventStreamService.removeEventListener(eventType, handler);
      resolve(event.reply);
    }

    eventStreamService.addEventListener(eventType, handler);
  });
}
