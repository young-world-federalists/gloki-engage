import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCollaborations } from '../../../store/slices/communitiesSlice';
import { useT } from '../../../i18n';
import { SearchableSelect } from '../../shared';
import { codeForId, resolveCode } from '../../../utils/problemCode';
import type { DraftTag } from './writeTogetherApi';
import styles from './ProblemTagPicker.module.scss';

interface ProblemRow { id: string; title: string; community: string; }

export interface ProblemTagPickerProps {
  targetCommunity: string;
  value?: DraftTag;
  onChange: (tag: DraftTag | undefined) => void;
}

const ProblemTagPicker: React.FC<ProblemTagPickerProps> = ({ targetCommunity, value, onChange }) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { serverUrl, publicKey, contracts } = useAppSelector((s) => s.user);
  const collabs = useAppSelector((s) => s.communities.communityCollaborations);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  // Filter to community contracts (the user's community memberships)
  const myCommunityIds = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py').map((c) => c.id),
    [contracts],
  );

  // On mount and when deps change, fetch collaborations for the target community
  // and all of the user's communities (for cross-community code resolution).
  // Only fetch those not yet loaded.
  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    const ids = new Set([targetCommunity, ...myCommunityIds]);
    ids.forEach((id) => {
      if (id && !Array.isArray(collabs[id])) {
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: id }));
      }
    });
  }, [serverUrl, publicKey, targetCommunity, myCommunityIds, collabs, dispatch]);

  // Build ProblemRow[] for a given community id — only 'initiative' type items
  // (Collaboration.type is 'initiative' | 'wish' | 'agreement' | 'collab').
  const toRows = (id: string): ProblemRow[] =>
    (collabs[id] ?? [])
      .filter((c) => c.type === 'initiative')
      .map((c) => ({ id: c.id, title: c.title, community: id }));

  // Dropdown options: only the target community's initiatives
  const targetProblems = useMemo(() => toRows(targetCommunity), [collabs, targetCommunity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolver pool: all communities (for cross-community code paste)
  const allProblems = useMemo(
    () => Array.from(new Set([targetCommunity, ...myCommunityIds])).flatMap(toRows),
    [collabs, targetCommunity, myCommunityIds], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const options = targetProblems.map((p) => ({
    value: p.id,
    label: `${p.title}  ·  ${codeForId(p.id)}`,
  }));

  const handleFind = () => {
    const hit = resolveCode(codeInput, allProblems);
    if (hit) {
      onChange({ problemId: hit.id, title: hit.title, community: hit.community });
      setCodeInput('');
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && codeInput.trim()) handleFind();
  };

  return (
    <div className={styles.picker}>
      {/* Dropdown: target community's initiatives */}
      <SearchableSelect
        options={options}
        value={value?.problemId ?? ''}
        onChange={(id) => {
          const p = targetProblems.find((x) => x.id === id);
          onChange(p ? { problemId: p.id, title: p.title, community: p.community } : undefined);
        }}
        placeholder={t('writeTogether.pickProblem', 'Choose a problem…')}
      />

      {/* 3-word code paste row */}
      <div className={styles.codeRow}>
        <input
          className={styles.codeInput}
          value={codeInput}
          onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
          onKeyDown={handleKeyDown}
          placeholder={t('writeTogether.pasteCode', 'or paste a code · brave-otter-river')}
          aria-label={t('writeTogether.pasteCode', 'or paste a code · brave-otter-river')}
          aria-invalid={codeError}
          aria-describedby={codeError ? 'ptpCodeError' : undefined}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.codeBtn}
          onClick={handleFind}
          disabled={!codeInput.trim()}
        >
          {t('writeTogether.resolveCode', 'Find')}
        </button>
      </div>

      {/* Error: code not found */}
      {codeError && (
        <p id="ptpCodeError" className={styles.codeError} role="alert">
          {t('writeTogether.codeNotFound', 'No problem found for that code.')}
        </p>
      )}

      {/* Confirmation: currently tagged problem */}
      {value && (
        <p className={styles.tagged}>
          {t('writeTogether.taggedTo', 'Tagged to {title}', { title: value.title })}
        </p>
      )}
    </div>
  );
};

export default ProblemTagPicker;
