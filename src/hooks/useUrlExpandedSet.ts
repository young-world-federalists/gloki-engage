import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * A Set of expanded-card ids persisted in a URL search param (S23).
 *
 * Component state dies when a feed navigates away (e.g. into a discussion) and
 * the visitor comes back — the board remounts collapsed. Keeping the set in the
 * URL survives that round-trip: history restores the search param, the param
 * restores the expansion. Every write uses `replace: true`, so toggling cards
 * never spams the history stack.
 */
export function useUrlExpandedSet(param = 'open') {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(param);

  const expandedIds = useMemo(
    () => new Set(raw ? raw.split(',').filter(Boolean) : []),
    [raw],
  );

  const write = useCallback(
    (mutate: (next: Set<string>) => void) => {
      setSearchParams(
        (prev) => {
          const next = new Set((prev.get(param) ?? '').split(',').filter(Boolean));
          mutate(next);
          const out = new URLSearchParams(prev);
          if (next.size === 0) out.delete(param);
          else out.set(param, Array.from(next).join(','));
          return out;
        },
        { replace: true },
      );
    },
    [param, setSearchParams],
  );

  const toggleExpanded = useCallback(
    (id: string) => write((next) => { next.has(id) ? next.delete(id) : next.add(id); }),
    [write],
  );

  /** Idempotent add — safe to call from effects (StrictMode double-runs). */
  const expand = useCallback(
    (id: string) => write((next) => { next.add(id); }),
    [write],
  );

  return { expandedIds, toggleExpanded, expand };
}
