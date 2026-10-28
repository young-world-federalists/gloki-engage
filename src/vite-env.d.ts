/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** S42 — `beta` selects the beta trim (src/appMode.ts). Unset = demo. */
  readonly VITE_APP_MODE?: string;
  /** Node hosting application-wide contracts (src/services/applicationServer.ts). */
  readonly VITE_APPLICATION_SERVER_URL?: string;
  /** Agent on that node owning application-wide contracts. */
  readonly VITE_APPLICATION_AGENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
