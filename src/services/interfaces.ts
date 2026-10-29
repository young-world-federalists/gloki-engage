export interface IContract {
    id: string;
    name: string;
    contract: string;
    code: string;
    protocol: string;
    default_app: string;
    pid: string;
    address: string;
    group: string[];
    threshold: number;
    profile: string | null;
    constructor: Record<string, unknown>;
  }

  export interface IMethod {
    name: string;
    arguments?: string[];
    values?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
  }
  
  /**
   * S42 — what kind of account a Digital Agent is. Declared by the user at
   * sign-up (the beta's three doors); the organisation kind is declared, not
   * verified. `contributor` records interest in hosting a node — there is no
   * node runtime to point at yet.
   */
  export type AccountKind = 'person' | 'organisation' | 'contributor';

  export interface IProfile {
    firstName: string;
    lastName: string;
    userPhoto: string;
    userBio: string;
    // ISO 3166-1 alpha-2 country code (e.g. 'KE', 'NG', 'MW', 'CD') or 'OTHER'
    country?: string;
    // Optional public display name / pseudonym; when set, bylines show this
    // instead of first+last (see src/utils/displayName.ts).
    displayName?: string;
    // S42 — see AccountKind above. Absent on profiles created before S42.
    accountKind?: AccountKind;
  }

  export interface IPartner {
    address: string;
    agent: string;
    profile: string;
  }
