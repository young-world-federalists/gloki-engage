// S42 — the one place the build mode is read.
//
// `npm run build:beta` (and `npm run dev:beta`) set VITE_APP_MODE=beta. Every
// other script is the demo, exactly as before. The beta is the network, not
// the pipeline (Eston + Ouri, 15 Oct 2026): sign-up, a key, people who know
// you vouching for you, one shared forum. Everything else stays in the bundle
// and is hidden behind this flag — nothing is deleted.
export type AppMode = 'demo' | 'beta';

export const APP_MODE: AppMode = import.meta.env.VITE_APP_MODE === 'beta' ? 'beta' : 'demo';

/** True in the beta trim. Components read this flag; nothing else reads the env. */
export const isBeta = APP_MODE === 'beta';

/**
 * S43 — the language switcher is hidden in the beta (Eston, 2026-10-23: "drop the
 * languages for now"). English only in the test; fr/sw stay in the bundle and the
 * demo keeps its switcher. Flip this back to show it in the beta again.
 */
export const SHOW_LANGUAGES = !isBeta;
