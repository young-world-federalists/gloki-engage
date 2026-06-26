import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Badge, Button, EmptyState, InfoDisclosure, UserIdentity } from '../../shared';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import StartDraftForm from './StartDraftForm';
import DraftEditor from './DraftEditor';
import { getDrafts, type DraftEntry } from './writeTogetherApi';
import styles from './WriteTogetherPage.module.scss';

type View = { mode: 'list' } | { mode: 'start' } | { mode: 'edit'; draftId: string };

const WriteTogetherPage: React.FC<{ communityId: string }> = ({ communityId }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => s.communities.communityMembers[communityId]);
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const trust = useCommunityTrust(communityId);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  const canParticipate = !!publicKey && Array.isArray(members) && members.includes(publicKey);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey) return;
    try { setDrafts(await getDrafts(serverUrl, publicKey, communityId)); }
    catch (e) { console.error('[WriteTogether] load drafts', e); }
  }, [serverUrl, publicKey, communityId]);

  useEffect(() => { refresh(); }, [refresh]);

  const current = useMemo(
    () => (view.mode === 'edit' ? drafts.find((d) => d.id === view.draftId) : undefined),
    [view, drafts],
  );

  if (view.mode === 'start') {
    return (
      <div className={styles.page}>
        <StartDraftForm communityId={communityId}
          onStarted={(d) => { setDrafts((prev) => [d, ...prev]); setView({ mode: 'edit', draftId: d.id }); }}
          onCancel={() => setView({ mode: 'list' })} />
      </div>
    );
  }

  if (view.mode === 'edit' && current) {
    return (
      <div className={styles.page}>
        <DraftEditor communityId={communityId} draft={current} canParticipate={canParticipate}
          onBack={() => { refresh(); setView({ mode: 'list' }); }}
          onChanged={(d) => setDrafts((prev) => prev.map((x) => (x.id === d.id ? d : x)))} />
      </div>
    );
  }

  const nameOf = (pk: string) => {
    const p = profiles[pk];
    return (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '') || `${pk.slice(0, 8)}…`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>{t('writeTogether.title', 'Write together')}</h2>
          <InfoDisclosure label={t('writeTogether.explainerTitle', 'How writing together works')}>
            <p>{t('writeTogether.explainerBody', 'Draft a problem or solution as a community — write a first version, let others suggest edits that fold in by vote, then submit it to a community\'s feed.')}</p>
          </InfoDisclosure>
        </div>
        <p className={styles.subtitle}>{t('writeTogether.subtitle', 'Co-author a problem or solution, then submit it to the feed.')}</p>
      </div>

      <Button leftIcon={<PlusCircle size={18} />} onClick={() => setView({ mode: 'start' })} disabled={!canParticipate}>
        {t('writeTogether.startDraft', 'Start a draft')}
      </Button>

      {drafts.length === 0 ? (
        <EmptyState icon={<PlusCircle size={32} aria-hidden />} title={t('writeTogether.emptyTitle', 'No drafts yet')}
          message={t('writeTogether.empty', 'Start one and write it together.')} />
      ) : (
        <ul className={styles.list}>
          {drafts.map((d) => (
            <li key={d.id}>
              <button type="button" className={styles.row} onClick={() => setView({ mode: 'edit', draftId: d.id })}>
                <div className={styles.rowTop}>
                  <Badge tone={d.mode === 'problem' ? 'warning' : 'info'} size="sm">
                    {d.mode === 'problem' ? t('writeTogether.modeProblem', 'Problem') : t('writeTogether.modeSolution', 'Solution')}
                  </Badge>
                  <span className={styles.status}>{d.status === 'submitted' ? t('writeTogether.statusSubmitted', 'Submitted') : t('writeTogether.statusDraft', 'Draft')}</span>
                </div>
                <span className={styles.rowTitle}>{d.title}</span>
                <span className={styles.rowMeta}>{t('writeTogether.forCommunity', 'for {name}', { name: d.targetName })}{d.tag ? ` · ${d.tag.title}` : ''}</span>
                <UserIdentity name={nameOf(d.author)} countryCode={profiles[d.author]?.country} trustState={trust.trustOf(d.author)} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WriteTogetherPage;
