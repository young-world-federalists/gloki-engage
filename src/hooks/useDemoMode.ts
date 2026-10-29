import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Per-page demo switch (docs/DEMO_MODE.md). Every URL has two states:
//   /identity/communities            → the real page, on real data
//   /identity/communities?demo=true  → the page's demo variant, on demo data
// A page that has a demo variant renders it when this is true; a page that
// doesn't simply ignores the flag. Nothing is remembered: the flag lives in
// the URL only, so each tab and each link decides for itself.

const DEMO_PARAM = 'demo';

/** True when the current URL asks for the page's demo variant (`?demo=true`). */
export function useDemoMode(): boolean {
  const { search } = useLocation();
  return new URLSearchParams(search).get(DEMO_PARAM) === 'true';
}

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

/**
 * For links rendered by a demo variant: keeps the visitor in demo mode on
 * the next page. Outside demo mode it returns the path unchanged. Shared
 * chrome (menu, header) uses plain paths, so it always leads back to real.
 */
export function useDemoLink(): (path: string) => string {
  const demo = useDemoMode();
  return useCallback((path: string) => (demo ? withDemo(path) : path), [demo]);
}
