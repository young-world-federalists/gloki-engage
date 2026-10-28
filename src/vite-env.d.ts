/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** S42 — `beta` selects the beta trim (src/appMode.ts). Unset = demo. */
  readonly VITE_APP_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
