# Redux Migration and Server Layer Implementation

## Overview

This project has been migrated from local state management to Redux with a server layer architecture. The implementation includes:

### 1. Server Layer (`src/services/api.ts`)
- **API Functions**: Mock implementations that simulate REST API calls
- **Data Types**: TypeScript interfaces for Community, Issue, and User
- **Mock Data**: Sample data that can be easily replaced with real API calls
- **Error Handling**: Simulated network delays and error scenarios

### 2. Redux Store Structure
- **Store**: Configured with RTK (Redux Toolkit)
- **Slices**: 
  - `communitiesSlice`: Manages community data and operations
  - `issuesSlice`: Manages issue data and operations  
  - `userSlice`: Manages user data and operations
- **Async Thunks**: Handle API calls with loading states and error handling

### 3. URL-Based Data Loading
- **Direct Links**: Support for direct links to communities and issues
- **URL Parameters**: Automatic data fetching based on URL parameters
- **Custom Hook**: `useUrlData` handles URL-based data loading

### 4. Component Updates
- **Communities Component**: Now uses Redux instead of local state
- **CommunityView**: Fetches community data from Redux store
- **IssueView**: Fetches issue data from Redux store
- **Issues Component**: Manages issues through Redux

## Key Features

### Server Layer Functions
```typescript
// Community API
communityApi.fetchCommunities()
communityApi.fetchCommunity(id)
communityApi.createCommunity(data)
communityApi.updateCommunity(id, data)
communityApi.deleteCommunity(id)

// Issue API
issueApi.fetchIssues(communityId)
issueApi.fetchIssue(id)
issueApi.createIssue(data)
issueApi.updateIssue(id, data)
issueApi.deleteIssue(id)

// User API
userApi.fetchCurrentUser()
```

### Redux Actions
```typescript
// Communities
fetchCommunities()
fetchCommunity(id)
createCommunity(data)
updateCommunity({id, data})
deleteCommunity(id)

// Issues
fetchIssues(communityId)
fetchIssue(id)
createIssue(data)
updateIssue({id, data})
deleteIssue(id)

// User
fetchCurrentUser()
```

### URL Structure
- `/community/:communityId` - Direct link to community
- `/issue/:issueId` - Direct link to issue
- `/community/:communityId/issues` - Community issues page
- `/community/:communityId/members` - Community members page

## Migration Benefits

1. **Centralized State**: All data managed in Redux store
2. **Server Abstraction**: API layer can be easily replaced
3. **Direct Links**: Support for deep linking to specific content
4. **Loading States**: Consistent loading and error handling
5. **Type Safety**: Full TypeScript support throughout
6. **Scalability**: Easy to add new features and data types

## Next Steps

To replace mock data with real API calls:

1. Update functions in `src/services/api.ts`
2. Replace mock data arrays with actual API calls
3. Update error handling for real network errors
4. Add authentication headers to API calls
5. Implement real-time updates (WebSocket integration)

## File Structure

```
src/
├── services/
│   └── api.ts              # Server layer with mock API functions
├── store/
│   ├── index.ts            # Redux store configuration
│   ├── hooks.ts            # Typed Redux hooks
│   └── slices/
│       ├── communitiesSlice.ts
│       ├── issuesSlice.ts
│       └── userSlice.ts
├── hooks/
│   └── useUrlData.ts       # URL-based data loading
└── components/             # Updated components using Redux
``` 