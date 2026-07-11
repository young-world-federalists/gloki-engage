import React, { useMemo, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Button, SearchableSelect, SourcesInput } from '../../shared';
import type { SourceLink } from '../../../utils/sources';
import { useAlert } from '../../shared/useAlert';
import ProblemTagPicker from './ProblemTagPicker';
import { startDraft, type DraftEntry, type DraftMode, type DraftTag } from './writeTogetherApi';
import styles from './StartDraftForm.module.scss';

export interface StartDraftFormProps {
  communityId: string;
  onStarted: (draft: DraftEntry) => void;
  onCancel: () => void;
}

const StartDraftForm: React.FC<StartDraftFormProps> = ({ communityId, onStarted, onCancel }) => {
  const t = useT();
  const { serverUrl, publicKey, contracts } = useAppSelector((s) => s.user);
  const { showAlert, alertElement } = useAlert();
  const communities = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py'),
    [contracts],
  );
  const [mode, setMode] = useState<DraftMode>('problem');
  const [target, setTarget] = useState(communityId);
  const [tag, setTag] = useState<DraftTag | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sources, setSources] = useState<SourceLink[]>([{ url: '' }]);
  const [busy, setBusy] = useState(false);

  const targetName = communities.find((c) => c.id === target)?.name ?? '';
  const canStart = title.trim() && body.trim() && (mode === 'problem' || !!tag);

  const handleStart = async () => {
    if (busy || !serverUrl || !publicKey || !canStart) return;
    setBusy(true);
    try {
      const entry = await startDraft(serverUrl, publicKey, communityId, {
        mode, target, targetName, tag: mode === 'solution' ? tag : undefined, title: title.trim(), body: body.trim(), sources,
      });
      onStarted(entry);
    } catch (e) {
      console.error('[WriteTogether] start failed', e);
      showAlert(t('writeTogether.startFailed', 'Could not start the draft. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.form}>
      {/* No local back arrow (W3, §5 rule 19): the global AppHeader back pops
          this URL-addressed sub-view; the labeled Cancel below is the escape. */}
      <h2 className={styles.heading}>{t('writeTogether.startHeading', 'Start a draft')}</h2>

      <div className={styles.modeToggle} role="radiogroup" aria-label={t('writeTogether.modeLabel', 'Draft type')}>
        {(['problem', 'solution'] as DraftMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
            onClick={() => { setMode(m); if (m === 'problem') setTag(undefined); }}
          >
            {m === 'problem'
              ? t('writeTogether.modeProblem', 'Problem')
              : t('writeTogether.modeSolution', 'Solution')}
          </button>
        ))}
      </div>

      <label className={styles.label}>{t('writeTogether.draftingFor', 'Drafting for')}</label>
      <SearchableSelect
        options={communities.map((c) => ({ value: c.id, label: c.name }))}
        value={target}
        onChange={(id) => { setTarget(id); setTag(undefined); }}
        placeholder={t('writeTogether.chooseCommunity', 'Choose a community…')}
      />

      {mode === 'solution' && (
        <>
          <label className={styles.label}>{t('writeTogether.tagToProblem', 'Tag to a problem')}</label>
          <ProblemTagPicker targetCommunity={target} value={tag} onChange={setTag} />
        </>
      )}

      <label className={styles.label} htmlFor="wt-title">{t('writeTogether.titleLabel', 'Title')}</label>
      <input
        id="wt-title"
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('writeTogether.titlePlaceholder', 'A clear one-line title')}
      />

      <label className={styles.label} htmlFor="wt-body">{t('writeTogether.bodyLabel', 'First draft')}</label>
      <textarea
        id="wt-body"
        className={styles.textarea}
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('writeTogether.bodyPlaceholder', 'Write the first version — others can suggest edits.')}
      />

      <label className={styles.label}>{t('writeTogether.sourcesLabel', 'Sources')}</label>
      <p className={styles.hint}>{t('writeTogether.sourcesHint', 'Link to evidence that backs up your draft (optional).')}</p>
      <SourcesInput value={sources} onChange={setSources} />

      <Button fullWidth size="lg" loading={busy} disabled={!canStart} onClick={handleStart}>
        {t('writeTogether.start', 'Start draft')}
      </Button>
      <Button fullWidth variant="ghost" onClick={onCancel}>
        {t('common.cancel', 'Cancel')}
      </Button>
      {alertElement}
    </div>
  );
};

export default StartDraftForm;
