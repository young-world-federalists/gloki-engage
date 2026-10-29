import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Per-page demo switch (docs/DEMO_MODE.md). Every URL has two states:
//   /identity/communities            → the real page, on real data
//   /identity/communities?demo=true  → the page's demo state, on demo data
//
// The flag sticks to in-app navigation: once a page is shown in demo mode, the
// next pages stay in demo mode (DemoFlagUrlSync writes `?demo=true` back into
// their URL) until the visitor leaves on purpose — `?demo=false`, or a
// navigation carrying `{ leaveDemo: true }` state ("Show real data"). A fresh
// page load starts from the URL alone.

const DEMO_PARAM = 'demo';

let stickyDemo = false;

/** Updates the carried-over flag from a location and returns it. */
function resolveDemoFlag(search: string, state: unknown): boolean {
  const param = new URLSearchParams(search).get(DEMO_PARAM);
  if (param === 'true') stickyDemo = true;
  else if (param === 'false' || (state as { leaveDemo?: boolean } | null)?.leaveDemo) stickyDemo = false;
  return stickyDemo;
}

/** True when the current page is in demo mode (`?demo=true`, or carried over from the previous page). */
export function useDemoMode(): boolean {
  const { search, state } = useLocation();
  return resolveDemoFlag(search, state);
}

/** Navigation state that leaves demo mode (for links back to real data). */
export const LEAVE_DEMO_STATE = { leaveDemo: true } as const;

/** Adds `?demo=true` to an in-app path, keeping any query or hash it has. */
export function withDemo(path: string): string {
  const hashAt = path.indexOf('#');
  const hash = hashAt >= 0 ? path.slice(hashAt) : '';
  const rest = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const queryAt = rest.indexOf('?');
  const pathname = queryAt >= 0 ? rest.slice(0, queryAt) : rest;
  const params = new URLSearchParams(queryAt >= 0 ? rest.slice(queryAt + 1) : '');
  params.set(DEMO_PARAM, 'true');
  return `${pathname}?${params.toString()}${hash}`;
}

/** Builds in-app links that stay in demo mode. Outside demo mode it returns the path unchanged. */
export function useDemoLink(): (path: string) => string {
  const demo = useDemoMode();
  return useCallback((path: string) => (demo ? withDemo(path) : path), [demo]);
}

/**
 * Keeps the URL honest while the flag is carried over: a page reached from a
 * demo page gets `?demo=true` written back into its URL (a replace, so the
 * page doesn't re-render in another mode and the link stays shareable).
 * Mount once inside the router.
 */
export function DemoFlagUrlSync(): null {
  const demo = useDemoMode();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!demo) return;
    if (new URLSearchParams(location.search).get(DEMO_PARAM) === 'true') return;
    navigate(withDemo(`${location.pathname}${location.search}${location.hash}`), {
      replace: true,
      state: location.state,
    });
  }, [demo, location, navigate]);
  return null;
}
