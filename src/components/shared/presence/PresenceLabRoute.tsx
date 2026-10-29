import PresenceShowcase from './PresenceShowcase';

/**
 * Route wrapper for the presence / connectivity / translation verification
 * gallery, mounted at `/lab/presence` (§10 [F→Foundation]).
 *
 * `PresenceShowcase` is self-contained and renders its own page chrome, so this
 * wrapper is intentionally thin — it exists only to give `App.tsx` a stable,
 * lane-owned entry point to lazy-load, keeping the showcase itself free of any
 * routing concerns.
 */
export default function PresenceLabRoute() {
  return <PresenceShowcase />;
}
