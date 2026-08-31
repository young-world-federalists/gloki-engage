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
import type { IMethod, IContract } from '../../services/interfaces';
import type { IProfile, IPartner } from '../../services/interfaces';
import { getProfile } from '../../services/contracts/gloki';
import { getCommunityDetails, isGlokiEngageCommunityContract } from '../../services/contracts/glokiEngageCommunity';
import type { InitiativeRef } from '../../services/contracts/glokiEngageInitiative';
import { stripSensitiveProfileFields } from '../../utils/localSecrets';
import type { RootState } from '../index';

// Gloki's `timestamp()` returns a packed digit string: YYYYMMDDHHMMSS +
// fractional digits. Parsed only far enough to sort correctly, not for
// true epoch-ms precision.
function parseGlokiTimestamp(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string' || !/^\d{14,}$/.test(raw)) return 0;
  const parsed = Number(raw.slice(0, 14));
  return Number.isNaN(parsed) ? 0 : parsed;
}

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
  initiativeTallies: Record<string, { up: number; down: number; total: number }>; // initiativeContractId -> problem-vote tally
  communityTasks: Record<string, Record<string, boolean>>; // contractId -> agentId -> approval status
  communityNominates: Record<string, string[]>; // contractId -> array of candidate public keys
  communityCollaborations: Record<string, Collaboration[]>; // contractId -> collaborations list (real gloki-engage communities populate this too — see fetchCollaborations)
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
  initiativeTallies: {},
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

// For a real gloki-engage community, reads its own list of initiative refs
// ({address, agent, contract}) and each ref's details+roles — an initiative
// may live on a different member's server than the community itself, so
// every ref is read in parallel rather than one at a time. Mapped into the
// same Collaboration shape the demo path already produces, so ActivityCard
// and everything downstream of it need no changes at all.
async function fetchGlokiEngageCollaborations(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<Collaboration[]> {
  const refsResult = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_initiatives', values: {} } as IMethod,
  });
  const refs: InitiativeRef[] = Array.isArray(refsResult) ? refsResult : [];

  const items = await Promise.all(
    refs.map(async (ref): Promise<Collaboration | null> => {
      try {
        const [details, roles] = await Promise.all([
          contractRead({
            serverUrl: ref.address,
            publicKey: ref.agent,
            contractId: ref.contract,
            method: { name: 'get_details', values: {} } as IMethod,
          }),
          contractRead({
            serverUrl: ref.address,
            publicKey: ref.agent,
            contractId: ref.contract,
            method: { name: 'get_roles', values: {} } as IMethod,
          }),
        ]);
        if (!details) return null;
        // "title"/"description" here are the Collaboration/ActivityCard
        // field names — they map onto the contract's own description
        // (short label) / explanation (long body), matching the field
        // mapping already established in CreateInitiativePage.tsx.
        return {
          id: ref.contract,
          type: 'initiative',
          title: details.description ?? '',
          description: details.explanation ?? '',
          author: (roles && roles.author) || details.author || '',
          createdAt: parseGlokiTimestamp(details.createdAt),
          hostServer: ref.address,
          hostAgent: ref.agent,
        };
      } catch {
        return null;
      }
    }),
  );

  return items.filter((item): item is Collaboration => item !== null);
}

export const fetchCollaborations = createAsyncThunk(
  'communities/fetchCollaborations',
  async (args: { serverUrl: string; publicKey: string; contractId: string }, { getState }) => {
    const { serverUrl, publicKey, contractId } = args;
    const community = (getState() as RootState).user.contracts.find((c: IContract) => c.id === contractId);

    let collaborations: Collaboration[];
    if (community && isGlokiEngageCommunityContract(community)) {
      collaborations = await fetchGlokiEngageCollaborations(serverUrl, publicKey, contractId);
    } else {
      const result = await getCollaborations(serverUrl, publicKey, contractId);
      collaborations = Array.isArray(result) ? result : [];
    }

    return { contractId, collaborations };
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

// Real counterpart to fetchCommunityMembers's get_partners+get_all_people call,
// for communities deployed through glokiEngageCommunity.ts. `get_partners` is
// a *contract-independent* method every deployed contract answers by default
// (it reflects the replication/consensus group actually running the
// contract) — the gloki-engage contract defines no membership methods of its
// own, but this one works regardless. Verified shape (2026-08-31, against a
// real community): `[{ address, agent, profile }]`, i.e. exactly IPartner[].
//
// Simplification, deliberate for now: a contract's partners are not
// necessarily its community's members in general — a contract's replication
// group and "who belongs to this community" are logically separate, and real
// membership needs its own governance (join requests, approvals) layered on
// top, independent of who happens to host the contract. That governance
// isn't implemented yet, so for now partnership stands in for membership:
// whoever co-hosts the contract counts as a member.
async function fetchGlokiEngageCommunityMembers(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  existingProfiles: Record<string, IProfile>,
  dispatch: (action: ReturnType<typeof fetchMemberProfile>) => unknown,
): Promise<{ members: string[]; tasks: Record<string, boolean>; nominates: string[] }> {
  const partners = (await getPartners(serverUrl, publicKey, contractId)) as IPartner[];
  const members = partners.map((partner) => partner.agent);

  for (const partner of partners) {
    if (existingProfiles[partner.agent]) continue;
    if (partner.address && partner.agent && partner.profile) {
      dispatch(fetchMemberProfile({
        memberServerUrl: partner.address,
        memberPublicKey: partner.agent,
        memberContractId: partner.profile,
        memberAgent: partner.agent,
      }));
    }
  }

  // `tasks` (pending join-approval queue) and `nominates` (join candidates)
  // belong to a fuller membership-governance mechanism — approvals separate
  // from replication partnership — that isn't implemented for real
  // communities yet. Left empty (not omitted) so the result shape still
  // matches what the reducer expects from the demo path.
  return { members, tasks: {}, nominates: [] };
}

export const fetchCommunityMembers = createAsyncThunk(
  'communities/fetchCommunityMembers',
  async (args: { serverUrl: string; publicKey: string; contractId: string }, { getState, dispatch }) => {
    const { serverUrl, publicKey, contractId } = args;
    const state = getState() as RootState;
    const existingProfiles = state.communities.profiles;

    const community = state.user.contracts.find((c: IContract) => c.id === contractId);
    if (community && isGlokiEngageCommunityContract(community)) {
      const { members, tasks, nominates } = await fetchGlokiEngageCommunityMembers(
        serverUrl,
        publicKey,
        contractId,
        existingProfiles,
        dispatch,
      );
      return { contractId, members, tasks, nominates, newProfiles: {} };
    }

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
    // Local-only tally update — ProblemVoteFlow calls this with whatever it
    // just fetched/computed (on mount and after every vote) so every OTHER
    // reader of the same initiative's tally (useInitiativePost's readiness
    // banner + advance-bar gate) updates immediately too, instead of staying
    // stuck at whatever it read on its own one-time mount fetch.
    setInitiativeTally: (
      state,
      action: PayloadAction<{ initiativeId: string; tally: { up: number; down: number; total: number } }>,
    ) => {
      state.initiativeTallies[action.payload.initiativeId] = action.payload.tally;
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

export const { setCurrentCommunity, clearError, clearCommunityData, updateMemberProfile, setInitiativeStage, setInitiativeTally } = communitiesSlice.actions;
export default communitiesSlice.reducer;
