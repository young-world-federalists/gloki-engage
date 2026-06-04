import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { deliberationParticipant } from '../../../../services/demo/fixtures/deliberation';
import * as api from './discussionApi';
import type { Statement, EditSuggestion, Position, AnchoredComment } from './discussionApi';

export interface ResolvedAuthor {
  isMine: boolean;
  name: string; // persona/expert display name; caller renders "You" when isMine
  country: string; // '' when unknown
  initials: string;
}

/**
 * Resolve an author pk to display info. Personas/experts come from the
 * deliberation fixture; the current user's country overlays from their profile
 * (country is resolved CLIENT-SIDE — the contract stores only the pk).
 */
export function useAuthorResolver(): (pk: string) => ResolvedAuthor {
  const publicKey = useAppSelector((s) => s.user.publicKey) || 'me';
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  return useCallback(
    (pk: string) => {
      const base = deliberationParticipant(pk);
      const prof = profiles[pk];
      return {
        isMine: pk === publicKey,
        name: base.name,
        country: prof?.country || base.country,
        initials: base.initials,
      };
    },
    [publicKey, profiles],
  );
}

export interface DiscussionData {
  statement: Statement;
  edits: EditSuggestion[];
  positions: Position[];
  anchored: AnchoredComment[];
  /** Distinct pks who have taken part in any way (the participation snapshot). */
  participants: string[];
  participantCount: number;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_STATEMENT: Statement = { title: '', body: '', coAuthors: [] };

/**
 * Single read source for the Stage 2 co-authoring space. Reads statement /
 * edits / positions / anchored through the seam and derives the participation
 * snapshot (any contribution — suggest or support an edit, add or support a
 * position, post an anchored reply). `SharedStatement`, `PositionsBoard`, and
 * `ParticipationMeter` all consume one instance so counts stay consistent and a
 * single `refresh()` updates every surface after a write.
 */
export function useDiscussionData(contractId: string | null, isReady: boolean): DiscussionData {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [statement, setStatement] = useState<Statement>(EMPTY_STATEMENT);
  const [edits, setEdits] = useState<EditSuggestion[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [anchored, setAnchored] = useState<AnchoredComment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const [st, ed, pos] = await Promise.all([
        api.getStatement(serverUrl, publicKey, contractId),
        api.getEdits(serverUrl, publicKey, contractId),
        api.getPositions(serverUrl, publicKey, contractId),
      ]);
      // Anchored discussion lives under the statement and under each position.
      const anchors = ['statement', ...pos.map((p) => p.id)];
      const lists = await Promise.all(
        anchors.map((a) => api.getAnchoredComments(serverUrl, publicKey, contractId, a)),
      );
      setStatement(st);
      setEdits(ed);
      setPositions(pos);
      setAnchored(lists.flat());
      setLoaded(true);
    } catch (err) {
      console.error('[useDiscussionData] refresh failed:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    if (isReady && contractId) refresh();
  }, [isReady, contractId, refresh]);

  const participants = useMemo(() => {
    const set = new Set<string>();
    for (const pk of statement.coAuthors) set.add(pk);
    for (const e of edits) {
      set.add(e.author);
      e.supporters.forEach((s) => set.add(s));
    }
    for (const p of positions) {
      set.add(p.author);
      p.supporters.forEach((s) => set.add(s));
    }
    for (const a of anchored) set.add(a.author);
    set.delete('');
    return Array.from(set);
  }, [statement, edits, positions, anchored]);

  return {
    statement,
    edits,
    positions,
    anchored,
    participants,
    participantCount: participants.length,
    loaded,
    refresh,
  };
}

export default useDiscussionData;
