// S42 — the one place the build mode is read.
//
// `npm run build:beta` (and `npm run dev:beta`) set VITE_APP_MODE=beta. Every
// other script is the demo, exactly as before. The beta is the network, not
// the pipeline (Eston + Ouri, 15 Oct 2026): sign-up, a key, people who know
// you vouching for you, one shared forum. Everything else stays in the bundle
// and is hidden behind this flag — nothing is deleted.
type AppMode = 'demo' | 'beta';

const BUILT_AS_BETA = import.meta.env.VITE_APP_MODE === 'beta';

/**
 * A private switch to the full app on a beta build, for this browser only.
 * The beta writes the key as 'false' on first load, so it shows up in DevTools
 * (Application → Local Storage); set it to 'true' and reload for the full app.
 * Read once at startup: the mode never changes while the app runs. Not access
 * control — it only hides parts of the app.
 */
const FULL_APP_KEY = 'gloki.fullApp';

function fullAppOverride(): boolean {
  if (!BUILT_AS_BETA) return false;
  try {
    const value = localStorage.getItem(FULL_APP_KEY);
    if (value === null) {
      localStorage.setItem(FULL_APP_KEY, 'false');
      return false;
    }
    return value === 'true';
  } catch {
    return false;
  }
}

const APP_MODE: AppMode = BUILT_AS_BETA && !fullAppOverride() ? 'beta' : 'demo';

if (BUILT_AS_BETA && APP_MODE === 'demo') {
  console.info(`[AppMode] beta build running as the full app (${FULL_APP_KEY} = true)`);
}

/** True in the beta trim. Components read this flag; nothing else reads the env. */
export const isBeta = APP_MODE === 'beta';

/**
 * S43 — the language switcher is hidden in the beta (Eston, 2026-10-23: "drop the
 * languages for now"). English only in the test; fr/sw stay in the bundle and the
 * demo keeps its switcher. Flip this back to show it in the beta again.
 */
export const SHOW_LANGUAGES = !isBeta;
