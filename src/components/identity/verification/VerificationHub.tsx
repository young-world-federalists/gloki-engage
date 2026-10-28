import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Inbox, ChevronRight } from 'lucide-react';
import { Card, Button, Badge, TrustBadge, ProgressBar, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { isBeta } from '../../../appMode';
import { VERIFIED_THRESHOLD } from '../../../services/trustModel';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { useVerificationRegistry } from '../../../hooks/useVerificationRegistry';
import { becomeFounder, resetCandidate } from '../../../services/verificationRegistry';
import PathwayCards from './PathwayCards';
import SequentialVerification from './SequentialVerification';
import ApprovalHistory from './ApprovalHistory';
import pages from './VerificationPages.module.scss';
import styles from './VerificationHub.module.scss';

/**
 * /identity/verification — the app-wide verification hub (D8, D9). What an
 * unverified person sees depends on how many people are verified app-wide
 * (the verification contract, useVerificationRegistry):
 *   founder     nobody yet — a single "Get verified" button
 *   sequential  1–3 verified — ask every verified person (SequentialVerification)
 *   open        4+ verified — status card ("{X} of 4") and the four pathways
 * The AppHeader owns the page h1 (IdentityView titles); headings here are h2.
 */
const VerificationHub: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, vouchCount, trust, refetch } = useVerification();
  const registry = useVerificationRegistry({ live: true });
  const { byKey, loading } = useVerifiedMembers();
  const [busy, setBusy] = useState(false);
  const verified = trust === 'verified';
  // The founder and the sequential phase's people were not verified by four vouches.
  const myRecord = registry.status?.verified.find((v) => v.key === registry.me?.publicKey);
  const verifiedEarly = !!myRecord && myRecord.method !== 'vouches';
  const shown = Math.min(vouchCount, VERIFIED_THRESHOLD);
  const pendingCount = state?.pending.length ?? 0;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.show({ tone: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      await refetch();
      setBusy(false);
    }
  };

  if (!registry.status) {
    return (
      <div className={pages.page}>
        {registry.error ? (
          <Card className={styles.statusCard}>
            <p className={styles.statusBody}>
              {t('verification.registry.error', 'Could not reach the verification service. Check your connection and try again.')}
            </p>
            <Button onClick={() => void registry.refresh()}>{t('common.retry', 'Try again')}</Button>
          </Card>
        ) : (
          <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
        )}
      </div>
    );
  }

  if (!verified && registry.phase === 'founder') {
    return (
      <div className={pages.page}>
        <Card className={styles.statusCard}>
          <p className={styles.statusBody}>
            {t('verification.founder.body', 'If you are Eston or Ouri, you can become verified by clicking the button.')}
          </p>
          <Button
            disabled={busy || !registry.me}
            onClick={() => void run(() => becomeFounder(registry.me!))}
          >
            {t('gate.getVerified', 'Get verified')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!verified && registry.phase === 'sequential') {
    return (
      <div className={pages.page}>
        <SequentialVerification />
      </div>
    );
  }

  const candidate = registry.status.candidate;
  const candidateName = candidate ? (byKey.get(candidate)?.name ?? candidate.slice(0, 8)) : '';

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
          value={verified ? VERIFIED_THRESHOLD : shown}
          max={VERIFIED_THRESHOLD}
          size="md"
          variant={verified ? 'success' : 'primary'}
          label={t('trust.your.barLabel', 'Verification progress')}
        />
        {/* S42 — beta wording: "people who know you", and no community or
            vote to point at. Demo wording unchanged. */}
        <p className={styles.statusBody}>
          {verified
            ? (isBeta
                ? verifiedEarly
                  ? t('beta.verification.verifiedEarlyBody', 'You are one of the first verified people on Gloki. Others can now ask you to vouch for them.')
                  : t('beta.verification.verifiedBody', 'Four people who know you have confirmed you are a real person. That is what your account stands on.')
                : t('verification.hub.verifiedBody', 'Verified members can vote and back mandates in every community they join.'))
            : (isBeta
                ? t('beta.verification.explain', 'Four people who know you vouching that you are a real person makes you Verified everywhere on Gloki — no ID papers, no face scans.')
                : t(
                    'verification.hub.explain',
                    'Four members vouching that they know you as a real person makes you Verified everywhere on Gloki — no ID papers, no face scans.',
                  ))}
        </p>
        {verified && (
          <Button onClick={() => navigate('/')}>{t('verification.hub.goHome', 'Go to Home')}</Button>
        )}
      </Card>

      {registry.isSteward && candidate && (
        <Card className={styles.statusCard}>
          <p className={styles.statusBody}>
            {t('verification.steward.candidate', '{name} is being verified now. Only one person can be verified at a time until four people are verified.', {
              name: candidateName,
            })}
          </p>
          <Button variant="secondary" disabled={busy} onClick={() => void run(() => resetCandidate(registry.me!.publicKey))}>
            {t('verification.steward.reset', 'Reset current candidate')}
          </Button>
        </Card>
      )}

      {verified && (
        <button type="button" className={styles.requestsRow} onClick={() => navigate('/identity/verification/daily')}>
          <CalendarClock size={20} aria-hidden />
          <span className={styles.requestsLabel}>
            {t('verification.hub.dailyVolunteer', 'Join the daily session to help verify a member')}
          </span>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}

      {!verified && (
        <section aria-labelledby="verification-pathways-title">
          <h2 id="verification-pathways-title" className={pages.sectionTitle}>
            {isBeta ? t('beta.verification.pathways', 'Get your first approval') : t('verification.hub.pathways', 'Ways to get approvals')}
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
