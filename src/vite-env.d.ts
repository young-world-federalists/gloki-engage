/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** S42 — `beta` selects the beta trim (src/appMode.ts). Unset = demo. */
  readonly VITE_APP_MODE?: string;
  /** The application account's node, also the node the login suggests (src/services/applicationServer.ts). */
  readonly VITE_APPLICATION_SERVER_URL?: string;
  /** The application account's agent id on that node. */
  readonly VITE_APPLICATION_AGENT?: string;
  /** The application settings contract on that account. */
  readonly VITE_APPLICATION_SETTINGS_CONTRACT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
