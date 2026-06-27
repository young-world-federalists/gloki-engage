import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { getInitiative, resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getTally } from '../collaboration/flows/voting/problemVoteApi';
import { sanitizeExternalUrl } from '../../utils/urlSafety';
import { getProblemFraming } from '../stages/ProblemStage.demo';
import type { StagePost } from './InitiativeStageCard';

interface InitiativeDetails {
  title?: string;
  description?: string;
  countries?: string[];
  evidence?: string[];
}

interface Tally {
  up: number;
  down: number;
  total: number;
}

export interface UseInitiativePostResult {
  /** Read-zone fields derived from contract details + the demo framing seam. */
  post: Partial<StagePost>;
  /** True once the community has agreed (≥50% of members) this is a shared problem. */
  thresholdMet: boolean;
  /** Live "second" upvote count — drives the collapsed teaser + advance readiness. */
  up: number;
  loading: boolean;
}

/** Show a readable host instead of a long raw URL. */
function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Read-zone data for one initiative's **Problem** post, lifted out of
 * `ProblemStage` so the shared `InitiativeStageCard` can render the content as
 * its headline. All reads flow through the `api.ts` seam (`getInitiative` + the
 * problem-vote tally) and the `ProblemStage.demo` framing helper; everything
 * degrades silently on read failure (framing/tally are optional decoration).
 *
 * The headline merges the problem statement with who-it-affects into a single
 * paragraph (spec §2), and the meta line is reduced to one source link + a
 * country *count* (no flag-wall).
 */
export function useInitiativePost(
  initiativeId: string,
  communityMemberCount: number,
  fallbackTitle?: string,
): UseInitiativePostResult {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [details, setDetails] = useState<InitiativeDetails | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const det = await getInitiative(serverUrl, publicKey, initiativeId);
        if (!cancelled && det) setDetails(det as InitiativeDetails);
      } catch {
        /* details are optional framing — ignore */
      }
      try {
        const sc = await resolveInitiativeStageContract(
          serverUrl,
          publicKey,
          initiativeId,
          'problemVoteContractId',
        );
        if (sc?.contractId) {
          const tl = await getTally(serverUrl, publicKey, sc.contractId);
          if (!cancelled && tl) setTally(tl as Tally);
        }
      } catch {
        /* tally is optional — ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  const framing = useMemo(
    () => getProblemFraming(initiativeId, details?.title ?? fallbackTitle),
    [initiativeId, details?.title, fallbackTitle],
  );

  const post = useMemo<Partial<StagePost>>(() => {
    // Headline = the problem statement + who-it-affects, merged into one paragraph.
    const statement = framing?.description || details?.description || fallbackTitle || '';
    const whoWhy = framing?.whoWhy;
    const headline = whoWhy ? `${statement} ${whoWhy}` : statement;

    const displayCountries = framing?.countries ?? details?.countries ?? [];
    const countryCount = new Set(displayCountries).size;

    const rawSources = framing?.evidence ?? details?.evidence ?? [];
    const firstSource = rawSources
      .map((u) => sanitizeExternalUrl(u))
      .find((u): u is string => u !== null);

    const sdg = framing?.sdg ? { id: framing.sdg.id, label: framing.sdg.label } : undefined;

    return {
      headline,
      sdg,
      scope: framing?.scope,
      countryCount: countryCount || undefined,
      source: firstSource ? { label: prettyHost(firstSource), url: firstSource } : undefined,
    };
  }, [framing, details, fallbackTitle]);

  const needed = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const up = tally?.up ?? 0;
  const thresholdMet = tally != null && up >= needed;

  return { post, thresholdMet, up, loading };
}
