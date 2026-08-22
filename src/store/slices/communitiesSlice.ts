import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  getPartners,
  getAllPeople,
  getProperties,
  getCollaborations,
  getActiveMembers,
  type Collaboration,
} from '../../services/contracts/community';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import type { IProfile, IPartner } from '../../services/interfaces';
import { getProfile } from '../../services/contracts/gloki';
import { getCommunityDetails } from '../../services/contracts/glokiEngageCommunity';
import { stripSensitiveProfileFields } from '../../utils/localSecrets';

// Define Community interface
interface Community {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

// Communities state
interface CommunitiesState {
  currentCommunity: Community | null;
  error: string | null;
  communityProperties: Record<string, any>;
  communityMembers: Record<string, string[]>; // contractId -> array of member public keys
  communityActiveMembers: Record<string, number>; // contractId -> active member count (last N days)
  initiativeStages: Record<string, string>; // initiativeContractId -> stage ('problem' | 'discussion' | 'proposals' | 'vote' | 'mandate' | '_unknown')
  communityTasks: Record<string, Record<string, boolean>>; // contractId -> agentId -> approval status
  communityNominates: Record<string, string[]>; // contractId -> array of candidate public keys
  communityCollaborations: Record<string, Collaboration[]>; // contractId -> collaborations list
  profiles: Record<string, IProfile>; // memberPublicKey -> IProfile (across all communities)
  loading: boolean;
  membersLoading: Record<string, boolean>; // contractId -> loading status for members
  collaborationsLoading: Record<string, boolean>; // contractId -> loading status for collaborations
}

const initialState: CommunitiesState = {
  currentCommunity: null,
  error: null,
  communityProperties: {},
  communityMembers: {},
  communityActiveMembers: {},
  initiativeStages: {},
  communityTasks: {},
  communityNominates: {},
  communityCollaborations: {},
  profiles: {},
  loading: false,
  membersLoading: {},
  collaborationsLoading: {},
};

// Async thunks for community data (will be used in community pages)
export const fetchCommunityProperties = createAsyncThunk(
  'communities/fetchCommunityProperties',
  async (args: { serverUrl: string; publicKey: string; contractId: string }) => {
    const result = await getProperties(
      args.serverUrl,
      args.publicKey,
      args.contractId,
    );
    return { contractId: args.contractId, properties: result };
  }
);

// Real counterpart to fetchCommunityProperties, for communities deployed
// through glokiEngageCommunity.ts (contract === GLOKI_ENGAGE_COMMUNITY_CONTRACT).
// Writes into the SAME communityProperties[contractId] slot so consumers
// (Communities.tsx) don't need to know which kind of community they're
// reading — `description`/`createdAt` just show up either way.
export const fetchGlokiEngageCommunityDetails = createAsyncThunk(
  'communities/fetchGlokiEngageCommunityDetails',
  async (args: { serverUrl: string; publicKey: string; contractId: string }) => {
    const details = await getCommunityDetails(args);
    return { contractId: args.contractId, properties: details ?? {} };
  }
);

export const fetchMemberProfile = createAsyncThunk(
  'communities/fetchMemberProfile',
  async (args: { memberServerUrl: string; memberPublicKey: string; memberContractId: string; memberAgent: string }) => {
    const { memberServerUrl, memberPublicKey, memberContractId, memberAgent } = args;
    
    const profile = await getProfile(
      memberServerUrl,
      memberPublicKey,
      memberContractId,
    );
    
    return { memberAgent, profile: stripSensitiveProfileFields(profile as IProfile) };
  }
);

export const fetchCollaborations = createAsyncThunk(
  'communities/fetchCollaborations',
  async (args: { serverUrl: string; publicKey: string; contractId: string }) => {
    const result = await getCollaborations(
      args.serverUrl,
      args.publicKey,
      args.contractId,
    );
    const collaborations = Array.isArray(result) ? result : [];
    return { contractId: args.contractId, collaborations };
  },
);

export const fetchInitiativeStage = createAsyncThunk(
  'communities/fetchInitiativeStage',
  async (args: { serverUrl: string; publicKey: string; initiativeId: string }) => {
    try {
      const result = await contractRead({
        serverUrl: args.serverUrl,
        publicKey: args.publicKey,
        contractId: args.initiativeId,
        method: { name: 'get_stage', values: {} } as IMethod,
      });
      return { initiativeId: args.initiativeId, stage: typeof result === 'string' ? result : '_unknown' };
    } catch {
      return { initiativeId: args.initiativeId, stage: '_unknown' };
    }
  },
);

export const fetchCommunityActiveMembers = createAsyncThunk(
  'communities/fetchCommunityActiveMembers',
  async (args: { serverUrl: string; publicKey: string; contractId: string; days?: number }) => {
    const days = args.days ?? 30;
    // On old communities without get_active_members this throws; the rejection is
    // intentionally unhandled in the slice so state keeps the seed from
    // fetchCommunityMembers.fulfilled (raw member count).
    const active = await getActiveMembers(args.serverUrl, args.publicKey, args.contractId, days);
    return { contractId: args.contractId, count: active.length };
  },
);

export const fetchCommunityMembers = createAsyncThunk(
  'communities/fetchCommunityMembers',
  async (args: { serverUrl: string; publicKey: string; contractId: string }, { getState, dispatch }) => {
    const { serverUrl, publicKey, contractId } = args;
    const state = getState() as { communities: CommunitiesState };
    const existingProfiles = state.communities.profiles;
    
    try {
      // Step 1 & 2: Call get_partners and get_all_people in parallel
      const [partnersResult, allPeopleResult] = await Promise.all([
        getPartners(serverUrl, publicKey, contractId ),
        getAllPeople(serverUrl, publicKey, contractId )
      ]);

      const partners = partnersResult as IPartner[];
      const allPeople = allPeopleResult as { tasks: Record<string, boolean>; members: Record<string, unknown>; nominates: string[] };
      const members = Object.keys(allPeople.members) as string[];
      const taskAgents = Object.keys(allPeople.tasks) as string[];
      const nominates = Array.isArray(allPeople.nominates) ? allPeople.nominates : [];
      
      // Step 3: For each member and task agent, fetch their profile in parallel
      // Create a map of agent to partner info for quick lookup
      const partnerMap = new Map<string, IPartner>();
      partners.forEach(partner => {
        partnerMap.set(partner.agent, partner);
      });

      // Combine members and task agents for profile fetching (nominates don't need profiles - they're just used to check if user has requested to join)
      const allAgents = [...members, ...taskAgents];

      // Return members data immediately, don't wait for profiles
      const result = { 
        contractId, 
        members: members, // Just the array of member public keys
        tasks: allPeople.tasks, // Tasks dictionary
        nominates: nominates, // Array of candidate public keys
        newProfiles: {} // No profiles yet, they'll be loaded individually
      };

      // Fetch all profiles in parallel (fire-and-forget)
      for (const memberAgent of allAgents) {
        if (existingProfiles[memberAgent]) continue;

        const partner = partnerMap.get(memberAgent);
        if (!partner) {
          console.warn(`No partner found for member ${memberAgent}`);
          continue;
        }

        if (partner.address && partner.agent && partner.profile) {
          dispatch(fetchMemberProfile({
            memberServerUrl: partner.address,
            memberPublicKey: partner.agent,
            memberContractId: partner.profile,
            memberAgent: memberAgent,
          }));
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
);

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {
    setCurrentCommunity: (state, action: PayloadAction<Community | null>) => {
      state.currentCommunity = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCommunityData: (state, action: PayloadAction<string>) => {
      const contractId = action.payload;
      delete state.communityProperties[contractId];
      delete state.communityMembers[contractId];
      delete state.communityActiveMembers[contractId];
      delete state.communityTasks[contractId];
      delete state.communityNominates[contractId];
      delete state.communityCollaborations[contractId];
      delete state.membersLoading[contractId];
      delete state.collaborationsLoading[contractId];
      // Note: We don't delete from profiles as they might be used by other communities
    },
    updateMemberProfile: (state, action: PayloadAction<{ memberAgent: string; profile: IProfile }>) => {
      const { memberAgent, profile } = action.payload;
      state.profiles[memberAgent] = profile;
    },
    // Local-only stage update — call after a successful `set_stage` write so
    // Communities mandate counts refresh without a round-trip. Does not fix
    // cross-tab staleness (other tabs still see cached data until their next
    // fetchInitiativeStage).
    setInitiativeStage: (state, action: PayloadAction<{ initiativeId: string; stage: string }>) => {
      state.initiativeStages[action.payload.initiativeId] = action.payload.stage;
    },
  },
  extraReducers: (builder) => {
    // Fetch community properties
    builder
      .addCase(fetchCommunityProperties.fulfilled, (state, action) => {
        state.communityProperties[action.payload.contractId] = action.payload.properties;
      })
      .addCase(fetchCommunityProperties.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch community properties';
      })
      .addCase(fetchGlokiEngageCommunityDetails.fulfilled, (state, action) => {
        state.communityProperties[action.payload.contractId] = action.payload.properties;
      })
      .addCase(fetchGlokiEngageCommunityDetails.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch community details';
      });

    // Fetch community members with profiles
    builder
      .addCase(fetchCommunityMembers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Set loading flag for this specific community
        state.membersLoading[action.meta.arg.contractId] = true;
      })
      .addCase(fetchCommunityMembers.fulfilled, (state, action) => {
        state.loading = false;
        // Clear loading flag for this specific community
        state.membersLoading[action.payload.contractId] = false;
        // Store the array of member public keys for this community
        state.communityMembers[action.payload.contractId] = action.payload.members;
        // Seed activeMemberCount to raw count if not yet set — gives UI a sensible
        // default before fetchCommunityActiveMembers resolves.
        if (state.communityActiveMembers[action.payload.contractId] === undefined) {
          state.communityActiveMembers[action.payload.contractId] = action.payload.members.length;
        }
        // Store the tasks dictionary for this community
        state.communityTasks[action.payload.contractId] = action.payload.tasks;
        // Store the array of candidate public keys for this community
        state.communityNominates[action.payload.contractId] = action.payload.nominates;
        // Merge new profiles into the global profiles dictionary
        Object.assign(state.profiles, action.payload.newProfiles);
      })
      .addCase(fetchCommunityMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch community members';
        // Clear loading flag for this specific community on error
        if (action.meta.arg) {
          state.membersLoading[action.meta.arg.contractId] = false;
        }
      });

    // Fetch collaborations
    builder
      .addCase(fetchCollaborations.pending, (state, action) => {
        state.collaborationsLoading[action.meta.arg.contractId] = true;
      })
      .addCase(fetchCollaborations.fulfilled, (state, action) => {
        state.collaborationsLoading[action.payload.contractId] = false;
        state.communityCollaborations[action.payload.contractId] =
          action.payload.collaborations;
      })
      .addCase(fetchCollaborations.rejected, (state, action) => {
        if (action.meta.arg) {
          state.collaborationsLoading[action.meta.arg.contractId] = false;
        }
      });

    // Fetch active member count
    builder
      .addCase(fetchCommunityActiveMembers.fulfilled, (state, action) => {
        state.communityActiveMembers[action.payload.contractId] = action.payload.count;
      });

    // Fetch initiative stage
    builder
      .addCase(fetchInitiativeStage.fulfilled, (state, action) => {
        state.initiativeStages[action.payload.initiativeId] = action.payload.stage;
      });

    // Fetch individual member profile
    builder
      .addCase(fetchMemberProfile.fulfilled, (state, action) => {
        const { memberAgent, profile } = action.payload;
        state.profiles[memberAgent] = profile;
      })
      .addCase(fetchMemberProfile.rejected, (_, action) => {
        console.warn(`Failed to fetch profile for member ${action.meta.arg?.memberAgent}:`, action.error);
      });
  },
});

export const { setCurrentCommunity, clearError, clearCommunityData, updateMemberProfile, setInitiativeStage } = communitiesSlice.actions;
export default communitiesSlice.reducer;
