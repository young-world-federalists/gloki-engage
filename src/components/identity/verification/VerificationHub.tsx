import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ChevronRight } from 'lucide-react';
import { Card, Button, Badge, TrustBadge, ProgressBar } from '../../shared';
import { useT } from '../../../i18n';
import { VERIFIED_THRESHOLD } from '../../../services/trustModel';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import PathwayCards from './PathwayCards';
import ApprovalHistory from './ApprovalHistory';
import pages from './VerificationPages.module.scss';
import styles from './VerificationHub.module.scss';

/**
 * /identity/verification — the platform-wide verification hub (D8, D9).
 * Status card ("{X} of 4 approvals received" / "You're verified"), the ways to
 * collect approvals, the requests-to-vouch row, and the approval history.
 * The AppHeader owns the page h1 (IdentityView titles); headings here are h2.
 */
const VerificationHub: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { state, vouchCount, trust } = useVerification();
  const { byKey, loading } = useVerifiedMembers();
  const verified = trust === 'verified';
  const shown = Math.min(vouchCount, VERIFIED_THRESHOLD);
  const pendingCount = state?.pending.length ?? 0;

  return (
    <div className={pages.page}>
      <Card className={styles.statusCard}>
        {verified && (
          <div className={styles.confetti} aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={styles.piece} />
            ))}
          </div>
        )}
        <div className={styles.statusHead}>
          <h2 className={styles.statusTitle}>
            {verified
              ? t('verification.hub.verifiedTitle', "You're verified")
              : t('verification.hub.progress', '{count} of {threshold} approvals received', {
                  count: shown,
                  threshold: VERIFIED_THRESHOLD,
                })}
          </h2>
          <TrustBadge state={trust} vouchCount={vouchCount} size="md" />
        </div>
        <ProgressBar
          segments={VERIFIED_THRESHOLD}
          value={shown}
          max={VERIFIED_THRESHOLD}
          size="md"
          variant={verified ? 'success' : 'primary'}
          label={t('trust.your.barLabel', 'Verification progress')}
        />
        <p className={styles.statusBody}>
          {verified
            ? t('verification.hub.verifiedBody', 'Verified members can vote and back mandates in every community they join.')
            : t(
                'verification.hub.explain',
                'Four members vouching that they know you as a real person makes you Verified everywhere on Gloki — no ID papers, no face scans.',
              )}
        </p>
        {verified && (
          <Button onClick={() => navigate('/')}>{t('verification.hub.goHome', 'Go to Home')}</Button>
        )}
      </Card>

      {!verified && (
        <section aria-labelledby="verification-pathways-title">
          <h2 id="verification-pathways-title" className={pages.sectionTitle}>
            {t('verification.hub.pathways', 'Ways to get approvals')}
          </h2>
          <PathwayCards />
        </section>
      )}

      <button type="button" className={styles.requestsRow} onClick={() => navigate('/identity/verification/approve')}>
        <Inbox size={20} aria-hidden />
        <span className={styles.requestsLabel}>{t('verification.hub.requestsLink', 'Requests to vouch')}</span>
        {pendingCount > 0 && (
          <Badge tone="info" size="sm">
            {t('verification.hub.requestsPending', '{n} waiting', { n: pendingCount })}
          </Badge>
        )}
        <ChevronRight size={18} aria-hidden />
      </button>

      <ApprovalHistory approvals={state?.approvals ?? []} byKey={byKey} loading={loading || state === null} />
    </div>
  );
};

export default VerificationHub;
