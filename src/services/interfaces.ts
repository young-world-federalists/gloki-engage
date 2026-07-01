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
  
  export interface IProfile {
    firstName: string;
    lastName: string;
    userPhoto: string;
    userBio: string;
    // Optional field for per-user AI configuration stored locally in the browser.
    openaiApiKey?: string;
    // ISO 3166-1 alpha-2 country code (e.g. 'KE', 'NG', 'MW', 'CD') or 'OTHER'
    country?: string;
    // Optional public display name / pseudonym; when set, bylines show this
    // instead of first+last (see src/utils/displayName.ts).
    displayName?: string;
  }

  export interface IPartner {
    address: string;
    agent: string;
    profile: string;
  }
