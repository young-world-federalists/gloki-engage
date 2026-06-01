# SSE Event System Implementation

## Overview

This implementation provides a generic Server-Sent Events (SSE) listener mechanism for blockchain events. The system connects to the blockchain's SSE stream and allows components to register for specific event types.

## Architecture

### 1. Event Stream Service (`src/services/eventStream.ts`)

The core service that manages the SSE connection and event distribution:

- **Singleton Pattern**: Single instance manages the connection
- **Event Type Registration**: Components can register for specific event types
- **Automatic Cleanup**: Listeners are automatically removed when components unmount
- **Reconnection Logic**: Handles connection failures with exponential backoff

### 2. React Hook (`src/hooks/useEventStream.ts`)

Provides a React-friendly interface for components:

- **useEventStream**: Register for specific event types
- **useEventStreamConnection**: Get connection status and control methods

### 3. Integration with AuthContext

The SSE connection is automatically managed by the authentication flow:

- **Connect on Login**: Establishes connection when user logs in
- **Connect on App Load**: Reconnects when app loads with stored credentials
- **Disconnect on Logout**: Cleans up connection when user logs out

## Event Types

The system handles three main event types from the blockchain:

1. **contract_write**: Triggered when a contract is written to
2. **deploy_contract**: Triggered when a new contract is deployed
3. **a2a_connect**: Triggered when agent-to-agent connections are established

## Usage Examples

### Basic Event Listener

```typescript
import { useEventStream } from '../hooks/useEventStream';

const MyComponent = () => {
  useEventStream('contract_write', (event) => {
    console.log('Contract write detected:', event);
    // Handle the event
  });

  return <div>My Component</div>;
};
```

### Profile Component Integration

The Profile component demonstrates how to use the event system for real-time updates:

```typescript
// Listen for profile contract write events
useEventStream('contract_write', (event) => {
  if (user && contracts.length > 0) {
    const profileContract = contracts.find(contract => 
      contract.name === PROFILE_CONTRACT_NAME
    );
    if (profileContract && event.contract === profileContract.id) {
      console.log('Profile contract write detected, refreshing profile data');
      // Refresh profile data from the contract
      dispatch(readProfile({
        serverUrl: user.serverUrl,
        publicKey: user.publicKey,
        contractId: profileContract.id
      }));
    }
  }
});
```

## Connection Management

### Automatic Connection

The SSE connection is automatically established when:

1. User logs in successfully
2. App loads with valid stored credentials
3. User navigates to authenticated pages

### Connection Status

Components can check connection status:

```typescript
import { useEventStreamConnection } from '../hooks/useEventStream';

const MyComponent = () => {
  const { isConnected } = useEventStreamConnection();
  
  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
};
```

## Event Data Structure

Events from the blockchain follow this structure:

```typescript
interface BlockchainEvent {
  action: 'contract_write' | 'deploy_contract' | 'a2a_connect' | string;
  contract?: string; // Contract ID when applicable
  [key: string]: any; // Additional event-specific data
}
```

## Logging and Debugging

The system includes comprehensive logging:

- **Connection Events**: Logs when SSE connection is established/lost
- **Event Reception**: Logs all incoming events with full data
- **Listener Registration**: Logs when components register/unregister listeners
- **Error Handling**: Logs parsing errors and listener execution errors

### Console Output Examples

```
Connecting to SSE stream: https://server.com/stream?agent=abc123&contract=
SSE connection established
Event listener registered for: contract_write. Total listeners: 1
SSE Event received: {action: "contract_write", contract: "profile-123"}
Notifying 1 listeners for action: contract_write
Profile contract write detected, refreshing profile data
```

## Benefits

1. **Real-time Updates**: Components automatically update when blockchain data changes
2. **Decoupled Architecture**: Components don't need to know about polling or manual refresh
3. **Automatic Cleanup**: No memory leaks from event listeners
4. **Type Safety**: Full TypeScript support for event types and data
5. **Error Resilience**: Handles connection failures gracefully
6. **Scalable**: Easy to add new event types and listeners

## Future Enhancements

1. **Reconnection Logic**: Implement automatic reconnection with exponential backoff
2. **Event Filtering**: Add contract-specific filtering capabilities
3. **Event History**: Cache recent events for offline scenarios
4. **Batch Updates**: Group multiple events for efficient UI updates
5. **WebSocket Fallback**: Add WebSocket support as an alternative to SSE 