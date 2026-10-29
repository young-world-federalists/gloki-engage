# Testing Guide for Communities2 App

## 🚀 Getting Started

The development server is running at: **http://localhost:5173**

## 📋 Test Scenarios

### 1. Login Flow Testing

#### ✅ Valid Login Test
1. Open http://localhost:5173
2. Enter a valid public key (or use the "Generate" button)
3. Enter a valid server URL (e.g., `https://your-server.com`)
4. Click "Connect"
5. **Expected**: Should successfully login and redirect to profile page

#### ❌ Invalid Server Test
1. Enter a valid public key
2. Enter an invalid server URL (e.g., `https://invalid-server.com`)
3. Click "Connect"
4. **Expected**: Should show "Unable to connect to the server" error

#### ❌ Wrong Server Test
1. Enter a valid public key
2. Enter a server URL that responds but doesn't have the API (e.g., `https://google.com`)
3. Click "Connect"
4. **Expected**: Should show "The server doesn't recognize the API endpoints" error

#### ❌ Network Timeout Test
1. Enter a valid public key
2. Enter a server URL that doesn't respond (e.g., `https://192.168.1.999`)
3. Click "Connect"
4. **Expected**: Should show timeout error after 10 seconds

### 2. Profile Contract Testing

#### ✅ Profile Contract Deployment
1. Login with a new agent (first time)
2. **Expected**: Should automatically deploy profile contract
3. Check the "Contracts" tab to see the deployed contract

#### ✅ Profile Reading
1. After successful login, navigate to Profile page
2. **Expected**: Should display profile information from contract
3. Check if profile name appears in header

#### ✅ Profile Updating
1. Go to Profile page
2. Click "Edit Profile"
3. Change first name and last name
4. Click "Save"
5. **Expected**: Should save changes to contract and update display

### 3. Error Handling Testing

#### ✅ Error Message Display
1. Test different error scenarios
2. **Expected**: Error messages should be:
   - Clear and user-friendly
   - Different colors for different error types
   - Include actionable guidance

#### ✅ Loading States
1. During login process
2. **Expected**: Should show "Connecting..." and disable button
3. During profile operations
4. **Expected**: Should show loading indicators

### 4. Navigation Testing

#### ✅ Route Navigation
1. Test navigation between:
   - Profile page
   - Communities page
   - Join Community page
   - Contracts page
2. **Expected**: Should navigate smoothly between pages

### 5. Data Persistence Testing

#### ✅ Login Persistence
1. Login successfully
2. Refresh the page
3. **Expected**: Should remain logged in and load contracts

#### ✅ Profile Data Persistence
1. Update profile information
2. Refresh the page
3. **Expected**: Should retain profile changes

## 🐛 Known Issues to Test

1. **Profile Contract Deployment**: Verify it works for new agents
2. **Profile Reading**: Verify it works for existing agents with profile contracts
3. **Error Handling**: Verify all error scenarios are handled gracefully
4. **Loading States**: Verify loading indicators work correctly

## 📝 Test Results Template

```
Test Date: _______________
Tester: _______________

### Login Flow
- [ ] Valid login works
- [ ] Invalid server error handled
- [ ] Wrong server error handled
- [ ] Network timeout handled
- [ ] Empty input validation

### Profile Contract
- [ ] Auto-deployment works
- [ ] Profile reading works
- [ ] Profile updating works
- [ ] Profile display works

### Error Handling
- [ ] Error messages are clear
- [ ] Loading states work
- [ ] Different error types have different styling

### Navigation
- [ ] All routes work
- [ ] Navigation is smooth
- [ ] Data persists on refresh

### Issues Found:
1. _______________
2. _______________
3. _______________

### Notes:
_______________
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 🏗️ Architecture

This is a **client-only application** that interacts with external REST APIs. The app does not include any server-side code.

### Client-Side Features:
- ✅ React frontend with TypeScript
- ✅ Redux state management
- ✅ Authentication context
- ✅ Profile management
- ✅ Contract interaction
- ✅ Error handling and loading states

### External Server Requirements:

The app expects an external server (separate from this app) that provides these REST API endpoints:

- `GET /ibc/app/{agent}?action=is_exist_agent`
- `PUT /ibc/app/{agent}?action=register_agent`
- `GET /ibc/app/{agent}?action=get_contracts`
- `PUT /ibc/app/{agent}?action=deploy_contract`
- `POST /ibc/app/{agent}/{contract}/{method}?action=contract_read`

## 🧪 Testing Options

### Option 1: Mock Server (for development/testing)
- Run `node mock-server.cjs` to start a local mock server
- Use `http://localhost:3001` as the server URL
- This is only for testing, not part of the production app

### Option 2: Real External Server
- Deploy the app to any static hosting service
- Configure it to connect to your actual blockchain server
- The app will make API calls to your external server

## 📊 Expected API Endpoints

The app expects these endpoints on the external server:
- `GET /ibc/app/{agent}?action=is_exist_agent`
- `PUT /ibc/app/{agent}?action=register_agent`
- `GET /ibc/app/{agent}?action=get_contracts`
- `PUT /ibc/app/{agent}?action=deploy_contract`
- `POST /ibc/app/{agent}/{contract}/{method}?action=contract_read` 