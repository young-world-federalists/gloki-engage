import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Globe } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import { Banner, SegmentedControl, type SegmentOption } from '../shared';
import {
  getStagePermissions,
  setStagePermissions,
  DEFAULT_STAGE_PERMISSIONS,
  PIPELINE_STAGES,
  type PipelineStage,
  type StageRule,
} from '../../services/trust';
import styles from './CommunitySettings.module.scss';

const STAGE_LABEL: Record<PipelineStage, string> = {
  problem: 'Problem',
  discussion: 'Discussion',
  proposals: 'Solutions',
  vote: 'Vote',
  mandate: 'Mandate',
};

interface Props {
  communityId: string;
}

/**
 * Admin-facing per-stage participation settings. Each pipeline stage gets a rule
 * (Anyone / Members / Verified). Reads + persists through the community contract
 * seam (optimistic with snapshot rollback). In the UI-only demo the current user
 * owns the seeded communities, so we treat them as admin (documented in copy).
 * Permissions gate WHO may act — never how much a vote counts (one person, one vote).
 */
const CommunitySettings: React.FC<Props> = ({ communityId }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [perms, setPerms] = useState<Record<PipelineStage, StageRule>>(DEFAULT_STAGE_PERMISSIONS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    getStagePermissions({ serverUrl, publicKey, communityId }).then((p) => {
      if (!cancelled) {
        setPerms(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, communityId]);

  const ruleOptions: SegmentOption<StageRule>[] = [
    { value: 'anyone', label: t('perm.anyone', 'Anyone'), icon: <Globe size={14} /> },
    { value: 'members', label: t('perm.members', 'Members'), icon: <Users size={14} /> },
    { value: 'verified', label: t('perm.verified', 'Verified'), icon: <ShieldCheck size={14} /> },
  ];

  const onChange = async (stage: PipelineStage, rule: StageRule) => {
    if (!serverUrl || !publicKey) return;
    const prev = perms;
    const next = { ...perms, [stage]: rule };
    setPerms(next);
    setSaved(false);
    try {
      await setStagePermissions({ serverUrl, publicKey, communityId }, next);
      setSaved(true);
    } catch {
      setPerms(prev); // rollback (optimistic pattern)
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>{t('settings.title', 'Community settings')}</h2>
        <p>{t('settings.lead', 'Choose who can take part at each stage. Read-only viewing is always open.')}</p>
      </header>

      <Banner tone="info" title={t('settings.adminTitle', 'Admin settings')} className={styles.adminBanner}>
        {t(
          'settings.adminBody',
          'These rules apply to everyone in this community. Voting is always one person, one vote — these settings decide who may take part, not how much a vote counts.',
        )}
      </Banner>

      {!loading &&
        PIPELINE_STAGES.map((stage) => (
          <section key={stage} className={styles.stageRow}>
            <div className={styles.stageLabel}>{t(`nav.${stage}`, STAGE_LABEL[stage])}</div>
            <SegmentedControl<StageRule>
              options={ruleOptions}
              value={perms[stage]}
              onChange={(rule) => onChange(stage, rule)}
              fullWidth
              ariaLabel={t('settings.ruleFor', 'Participation rule for {stage}', { stage: STAGE_LABEL[stage] })}
            />
          </section>
        ))}

      {saved && (
        <p className={styles.saved} role="status">
          {t('settings.saved', 'Saved')}
        </p>
      )}
    </div>
  );
};

export default CommunitySettings;
