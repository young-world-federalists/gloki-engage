import { sanitizeExternalUrl } from './urlSafety';

// A citation attached to a solution, review, draft, or comment: an http(s) URL
// with an optional human label. Stored additively alongside the legacy
// `evidence: string[]` shape — a plain string is treated as a bare-URL source.
export interface SourceLink {
  url: string;
  label?: string;
}

const MAX_SOURCES = 5;
const MAX_LABEL = 120;

// Normalise arbitrary stored/entered source data into a clean SourceLink[]:
// accepts `string | { url, label? }` items, keeps only http(s) URLs (sanitised),
// trims labels, drops empties, and caps the count. Safe for both read (render)
// and write (contract payload) paths.
export function normalizeSources(raw: unknown): SourceLink[] {
  if (!Array.isArray(raw)) return [];
  const out: SourceLink[] = [];
  for (const item of raw) {
    let rawUrl: string | undefined;
    let rawLabel: string | undefined;
    if (typeof item === 'string') {
      rawUrl = item;
    } else if (item && typeof item === 'object') {
      const rec = item as { url?: unknown; label?: unknown };
      if (typeof rec.url === 'string') rawUrl = rec.url;
      if (typeof rec.label === 'string') rawLabel = rec.label;
    }
    if (!rawUrl) continue;
    const url = sanitizeExternalUrl(rawUrl);
    if (!url) continue;
    const label = rawLabel?.trim().slice(0, MAX_LABEL) || undefined;
    out.push(label ? { url, label } : { url });
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}
