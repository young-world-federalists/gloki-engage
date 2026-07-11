import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Badge, Button, EmptyState, InfoDisclosure, UserIdentity } from '../../shared';
import { displayNameFor } from '../../../utils/displayName';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import StartDraftForm from './StartDraftForm';
import DraftEditor from './DraftEditor';
import { getDrafts, type DraftEntry } from './writeTogetherApi';
import styles from './WriteTogetherPage.module.scss';

// Sub-views live in the URL (W3, S23 precedent — expansion lives in the URL):
// `?draft=new` is the start form, `?draft=<id>` the editor, no param the list.
// The global AppHeader back (history-pop, S23) and the hardware back therefore
// return editor → list naturally — the sub-views carry no back arrow of their
// own (§5 rule 19; the start form gets a labeled Cancel instead).
const WriteTogetherPage: React.FC<{ communityId: string }> = ({ communityId }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => s.communities.communityMembers[communityId]);
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const trust = useCommunityTrust(communityId);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const draftParam = searchParams.get('draft');

  const canParticipate = !!publicKey && Array.isArray(members) && members.includes(publicKey);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey) return;
    try { setDrafts(await getDrafts(serverUrl, publicKey, communityId)); }
    catch (e) { console.error('[WriteTogether] load drafts', e); }
    finally { setLoaded(true); }
  }, [serverUrl, publicKey, communityId]);

  // Re-read on entry AND whenever the sub-view changes: returning from the
  // editor via history back must show fresh statuses (the demo seam emits no
  // write events), and a deep-linked editor needs the list for its lookup.
  useEffect(() => { void refresh(); }, [refresh, draftParam]);

  const current = useMemo(
    () => (draftParam && draftParam !== 'new' ? drafts.find((d) => d.id === draftParam) : undefined),
    [draftParam, drafts],
  );

  // Stale/unknown editor ids fall back to the list once drafts have loaded
  // (replace — a dead entry shouldn't survive in history).
  useEffect(() => {
    if (loaded && draftParam && draftParam !== 'new' && !current) {
      setSearchParams({}, { replace: true });
    }
  }, [loaded, draftParam, current, setSearchParams]);

  // Mirror the header's backTo: pop history when there is one (matches the
  // hardware back), else clear the param in place (deep-linked form).
  const cancelStart = () => {
    if (location.key !== 'default') navigate(-1);
    else setSearchParams({}, { replace: true });
  };

  if (draftParam === 'new') {
    return (
      <div className={styles.page}>
        <StartDraftForm communityId={communityId}
          onStarted={(d) => {
            setDrafts((prev) => [d, ...prev]);
            // Replace the spent form entry so back from the editor skips it.
            setSearchParams({ draft: d.id }, { replace: true });
          }}
          onCancel={cancelStart} />
      </div>
    );
  }

  if (current) {
    return (
      <div className={styles.page}>
        <DraftEditor communityId={communityId} draft={current} canParticipate={canParticipate}
          onChanged={(d) => setDrafts((prev) => prev.map((x) => (x.id === d.id ? d : x)))} />
      </div>
    );
  }

  const nameOf = (pk: string) => displayNameFor(profiles[pk], pk);

  return (
    <div className={styles.page}>
      {/* The section title + intro render in the AppHeader title block (S23);
          the (i) explainer sits beside the action it explains. */}
      <div className={styles.actionRow}>
        <Button leftIcon={<PlusCircle size={18} />} onClick={() => setSearchParams({ draft: 'new' })} disabled={!canParticipate}>
          {t('writeTogether.startDraft', 'Start a draft')}
        </Button>
        <InfoDisclosure label={t('writeTogether.explainerTitle', 'How writing together works')}>
          <p>{t('writeTogether.explainerBody', 'Draft a problem or solution as a community — write a first version, let others suggest edits that fold in by vote, then submit it to a community\'s feed.')}</p>
        </InfoDisclosure>
      </div>

      {drafts.length === 0 ? (
        <EmptyState icon={<PlusCircle size={32} aria-hidden />} title={t('writeTogether.emptyTitle', 'No drafts yet')}
          message={t('writeTogether.empty', 'Start one and write it together.')} />
      ) : (
        <ul className={styles.list}>
          {drafts.map((d) => (
            <li key={d.id}>
              <button type="button" className={styles.row} onClick={() => setSearchParams({ draft: d.id })}>
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
