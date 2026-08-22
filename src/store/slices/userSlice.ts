import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { isExistAgent, registerAgent, getContracts, deployContract } from '../../services/api';
import type { IContract, IProfile } from '../../services/interfaces';
import type { RootState } from '../index';
const profileContractCode = '';
import { clearRemoteOpenAIApiKey, getProfile } from '../../services/contracts/gloki';
import {
  mergeLocalOpenAIApiKey,
  setLocalOpenAIApiKey,
  stripSensitiveProfileFields,
} from '../../utils/localSecrets';
import {
  findDigitalAgentContract,
  readDigitalAgentProfile,
  type DigitalAgentProfileFields,
} from '../../components/identity/agent/digitalAgentContract';

// Interfaces from contractsSlice

// Profile contract unique name
export const PROFILE_CONTRACT_NAME = "unique-gloki-communities-profile-contract";

// Community contract unique name
export const COMMUNITY_CONTRACT_NAME = "unique-gloki-communities-community-contract";

// Complete user state
interface UserState {
  // Authentication
  publicKey: string | null;
  serverUrl: string | null;
  
  // User data
  profile: IProfile | null;
  profileContractId: string | null;

  // The gloki-engage Digital Agent's own profile — read fresh from its real
  // contract on every login (see fetchContracts). null contract id or
  // profile means the agent hasn't onboarded (deployed one) yet; nothing
  // about this is cached in localStorage.
  digitalAgentProfile: DigitalAgentProfileFields | null;
  digitalAgentContractId: string | null;
  // False until fetchContracts has heard back from the server (found or not
  // found) at least once for the CURRENT identity. App.tsx's RootRoute
  // shows a spinner while this is false, rather than guessing — onboarding
  // vs. skip is a server-driven decision, never shown before it's known.
  digitalAgentProfileChecked: boolean;

  // Contracts
  contracts: IContract[];

  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  // Authentication
  publicKey: null,
  serverUrl: null,

  // User data
  profile: null,
  profileContractId: null,
  digitalAgentProfile: null,
  digitalAgentContractId: null,
  digitalAgentProfileChecked: false,

  // Contracts
  contracts: [],

  // UI state
  loading: false,
  error: null,
};

// Main initialization thunk - handles everything
export const initializeUser = createAsyncThunk(
  'user/initializeUser',
  async (_, { dispatch, getState, rejectWithValue }) => {
    const { publicKey, serverUrl } = (getState() as RootState).user;
    
    if (!publicKey || !serverUrl) {
      return rejectWithValue('Missing publicKey or serverUrl');
    }
    
    try {
      // 1. Check if agent exists
      const agentExists = await isExistAgent({serverUrl, publicKey });
      
      if (!agentExists) {
        // Register agent if it doesn't exist
        await registerAgent({serverUrl, publicKey });
      }
      
      // 2. Get contracts (awaited — the digital-agent-profile check inside
      // fetchContracts needs to finish before the app decides whether to
      // show onboarding or skip straight to the home page)
      await dispatch(fetchContracts());

      return null;
    } catch (error) {
      return rejectWithValue(String(error));
    }
  }
);

// Fetch contracts (for refreshing)
export const fetchContracts = createAsyncThunk(
  'user/fetchContracts',
  async (_, { dispatch, getState, rejectWithValue }) => {
    const { publicKey, serverUrl } = (getState() as RootState).user;
    
    if (!publicKey || !serverUrl) {
      return rejectWithValue('Missing publicKey or serverUrl');
    }
    
          try {
        const contracts = await getContracts({serverUrl, publicKey });

        // Store contracts in Redux state first
        await dispatch(setContracts(contracts || []));

        // Check the real server, every login, for this agent's own
        // gloki-engage Digital Agent profile contract — no local cache or
        // "already onboarded" flag short-circuits this. App.tsx's
        // RootRoute reads state.user.digitalAgentProfile directly to decide
        // whether to show onboarding or skip to the home page, so this is
        // the single source of truth for that decision, sourced fresh from
        // the server on both the fresh-login and stored-credentials paths
        // (both dispatch through here via initializeUser).
        const profileContract = findDigitalAgentContract(contracts || []);
        if (profileContract) {
          try {
            const profile = await readDigitalAgentProfile({
              serverUrl,
              publicKey,
              contractId: profileContract.id,
            });
            dispatch(setDigitalAgentProfile({ profile, contractId: profile ? profileContract.id : null }));
          } catch (error) {
            console.error('[fetchContracts] Failed to read digital agent profile contract:', error);
            dispatch(setDigitalAgentProfile({ profile: null, contractId: null }));
          }
        } else {
          dispatch(setDigitalAgentProfile({ profile: null, contractId: null }));
        }

        // Then call readProfile which can access contracts from state
        dispatch(readProfile());

        return contracts || [];
    } catch (error) {
      // Even on failure (e.g. getContracts itself couldn't reach the
      // server), mark the check as done with "no profile found" rather
      // than leaving digitalAgentProfileChecked false forever — otherwise
      // RootRoute would spin indefinitely instead of falling back to onboarding.
      dispatch(setDigitalAgentProfile({ profile: null, contractId: null }));
      return rejectWithValue(String(error));
    }
  }
);

// Fetch contracts (for refreshing)
export const readProfile = createAsyncThunk(
  'user/readProfile',
  async (_, { rejectWithValue, getState }) => {
    const { publicKey, serverUrl, contracts } = (getState() as RootState).user;

    if (!publicKey || !serverUrl) {
      return rejectWithValue('Missing publicKey or serverUrl');
    }
    
    try {
      // 3. Handle profile contract
      const profileContract = contracts?.find((c: IContract) => {
        return c.name === PROFILE_CONTRACT_NAME;
      });
      let profileData = null;
      
      let profileContractId = null;
      
      if (profileContract) {
        // Read profile data from existing contract
        const profileResult = await getProfile(
          serverUrl,
          publicKey,
          profileContract.id,
        );
        const remoteProfile = (profileResult || {}) as IProfile;
        const remoteApiKey = typeof remoteProfile.openaiApiKey === 'string'
          ? remoteProfile.openaiApiKey.trim()
          : '';

        if (remoteApiKey) {
          setLocalOpenAIApiKey(serverUrl, publicKey, remoteApiKey);
          try {
            await clearRemoteOpenAIApiKey(serverUrl, publicKey, profileContract.id);
          } catch (error) {
            console.warn('Failed to clear remote AI API key from profile contract:', error);
          }
        }

        profileData = mergeLocalOpenAIApiKey(
          stripSensitiveProfileFields(remoteProfile),
          serverUrl,
          publicKey,
        );
        profileContractId = profileContract.id;
      } else {
        // Deploy profile contract - SSE listener will handle updating contracts list
        await deployContract({
          serverUrl,
          publicKey,
          name: PROFILE_CONTRACT_NAME,
          contract: 'gloki_contract.py',
          code: profileContractCode
        });
        
        // Set default profile data
        profileData = {
          firstName: '',
          lastName: '',
          userPhoto: '',
          userBio: '',
          country: '',
        };
        profileData = mergeLocalOpenAIApiKey(profileData, serverUrl, publicKey);
        // Note: profileContractId will be null here, but will be updated when contracts are refreshed
      }
      
      return { profile: profileData, profileContractId };
    } catch (error) {
      return rejectWithValue(String(error));
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<{ publicKey: string; serverUrl: string } | null>) => {
      if (action.payload) {
        state.publicKey = action.payload.publicKey;
        state.serverUrl = action.payload.serverUrl;
      } else {
        state.publicKey = null;
        state.serverUrl = null;
      }
      // A (re)set identity means whatever we knew about the PREVIOUS
      // identity's profile no longer applies — don't let RootRoute act on
      // stale data from a different agent while the new check is pending.
      state.digitalAgentProfile = null;
      state.digitalAgentContractId = null;
      state.digitalAgentProfileChecked = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setContracts: (state, action: PayloadAction<IContract[]>) => {
      state.contracts = action.payload;
    },
    setDigitalAgentProfile: (
      state,
      action: PayloadAction<{ profile: DigitalAgentProfileFields | null; contractId: string | null }>,
    ) => {
      state.digitalAgentProfile = action.payload.profile;
      state.digitalAgentContractId = action.payload.contractId;
      state.digitalAgentProfileChecked = true;
    },
    clearUser: (state) => {
      state.publicKey = null;
      state.serverUrl = null;
      state.profile = null;
      state.profileContractId = null;
      state.digitalAgentProfile = null;
      state.digitalAgentContractId = null;
      state.digitalAgentProfileChecked = false;
      state.contracts = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize user
    builder
      .addCase(initializeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUser.fulfilled, (state) => {
        state.loading = false;
        // initializeUser returns null, so no payload to process
      })
      .addCase(initializeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch contracts
      .addCase(fetchContracts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Read profile
      .addCase(readProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(readProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.profileContractId = action.payload.profileContractId;
      })
      .addCase(readProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { setCurrentUser, clearError, setContracts, setDigitalAgentProfile, clearUser } = userSlice.actions;
export default userSlice.reducer;
