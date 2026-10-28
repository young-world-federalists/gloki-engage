import React, { useState } from 'react';
import { Hourglass, Users } from 'lucide-react';
import { Card, Button, Badge, EmptyState, ProgressBar, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { useVerificationRegistry } from '../../../hooks/useVerificationRegistry';
import { requestVouch, type MemberSummary } from '../../../services/verification';
import MemberList from './MemberList';
import pages from './VerificationPages.module.scss';
import styles from './VerificationHub.module.scss';

/**
 * The sequential phase (fewer than four people verified app-wide): one
 * candidate at a time, vouched by EVERY verified person. The candidate sees
 * all of them and asks each one; anyone else sees that they must wait. Once
 * every vouch is in, useVerificationRegistry registers the candidate on the
 * contract, which re-checks each vouch.
 */
const SequentialVerification: React.FC = () => {
  const t = useT();
  const toast = useToast();
  const { ctx, state, refetch } = useVerification();
  const registry = useVerificationRegistry();
  const { members, loading } = useVerifiedMembers();
  const [inFlight, setInFlight] = useState<Set<string>>(() => new Set());

  const me = registry.me?.publicKey ?? '';
  const candidate = registry.status?.candidate ?? '';
  const required = registry.required;
  const received = Math.min(registry.vouchCountOf(me), required);

  if (candidate && candidate !== me) {
    return (
      <Card className={styles.statusCard}>
        <div className={styles.statusHead}>
          <h2 className={styles.statusTitle}>
            {t('verification.sequential.busyTitle', 'Someone else is being verified right now')}
          </h2>
          <Hourglass size={24} aria-hidden />
        </div>
        <p className={styles.statusBody}>
          {t(
            'verification.sequential.busyBody',
            'While Gloki has fewer than four verified people, only one person can be verified at a time. Please come back once they have finished.',
          )}
        </p>
      </Card>
    );
  }

  const vouchedBy = new Set((state?.approvals ?? []).map((a) => a.approver));
  const sentTo = new Map((state?.sent ?? []).map((r) => [r.approver, r.status]));

  const handleRequest = async (member: MemberSummary) => {
    if (!ctx) return;
    setInFlight((prev) => new Set(prev).add(member.publicKey));
    try {
      await requestVouch(ctx, member.publicKey);
      toast.show({ tone: 'success', message: t('verification.request.sentToast', 'Request sent to {name}', { name: member.name }) });
      await refetch();
    } catch (err) {
      toast.show({ tone: 'error', message: err instanceof Error ? err.message : String(err) });
      await refetch();
    } finally {
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(member.publicKey);
        return next;
      });
    }
  };

  const actionFor = (member: MemberSummary): React.ReactNode => {
    if (vouchedBy.has(member.publicKey)) {
      return <Badge tone="success" size="sm">{t('verification.request.vouched', 'Vouched')}</Badge>;
    }
    const status = sentTo.get(member.publicKey);
    if (inFlight.has(member.publicKey) || status === 'pending') {
      return <Button size="sm" variant="secondary" disabled>{t('verification.request.sent', 'Requested ✓')}</Button>;
    }
    if (status === 'declined') {
      return (
        <Button size="sm" variant="secondary" onClick={() => void handleRequest(member)}>
          {t('verification.request.askAgain', 'Ask again')}
        </Button>
      );
    }
    return <Button size="sm" onClick={() => void handleRequest(member)}>{t('verification.sequential.ask', 'Ask')}</Button>;
  };

  const complete = required > 0 && received >= required;

  return (
    <>
      <Card className={styles.statusCard}>
        <div className={styles.statusHead}>
          <h2 className={styles.statusTitle}>
            {t('verification.sequential.progress', '{count} of {threshold} verified people have vouched for you', {
              count: received,
              threshold: required,
            })}
          </h2>
        </div>
        <ProgressBar
          segments={required}
          value={received}
          max={required}
          size="md"
          variant="primary"
          label={t('trust.your.barLabel', 'Verification progress')}
        />
        <p className={styles.statusBody}>
          {t(
            'verification.sequential.explain',
            'Gloki has fewer than four verified people, so everyone already verified must vouch for you. Ask each of them below.',
          )}
        </p>
        {complete && (
          <Button onClick={() => void registry.refresh()}>
            {t('verification.sequential.complete', 'Complete verification')}
          </Button>
        )}
      </Card>

      <section aria-labelledby="verification-sequential-title">
        <h2 id="verification-sequential-title" className={pages.sectionTitle}>
          {t('verification.sequential.listTitle', 'Verified people')}
        </h2>
        <MemberList
          members={members}
          loading={loading}
          action={actionFor}
          showPresence={false}
          empty={<EmptyState compact icon={<Users size={48} aria-hidden />} title={t('verification.request.empty', 'No members match.')} />}
        />
      </section>
    </>
  );
};

export default SequentialVerification;
