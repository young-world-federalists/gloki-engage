import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { Card, Button, EmptyState, MemberCard, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { respondToRequest, type VouchRequest } from '../../../services/verification';
import pages from './VerificationPages.module.scss';
import styles from './ApprovePage.module.scss';

const LEAVE_MS = 300; // matches $transition-slow

/**
 * /identity/verification/approve — requests waiting on the user. Approve
 * slides the card out with a check; Decline removes it quietly. Requests only
 * reach verified members, so an unverified user sees the explanatory empty state.
 */
const ApprovePage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { ctx, state, refetch, trust } = useVerification();
  const { byKey } = useVerifiedMembers();
  const [leaving, setLeaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const verified = trust === 'verified';
  const pending = state?.pending ?? [];

  const respond = async (request: VouchRequest, approve: boolean) => {
    if (!ctx || busy) return;
    const name = byKey.get(request.requester)?.name ?? request.requester.slice(0, 8);
    setBusy(true);
    try {
      if (approve) {
        setLeaving(request.id);
        await new Promise((resolve) => setTimeout(resolve, LEAVE_MS));
      }
      await respondToRequest(ctx, request.id, approve);
      await refetch();
    } finally {
      setLeaving(null);
      setBusy(false);
    }
    if (approve) {
      toast.show({ tone: 'success', message: t('verification.approve.approvedToast', 'You vouched for {name}', { name }) });
    }
  };

  if (state === null) {
    return <div className={pages.page}><p className={pages.intro}>{t('common.loading', 'Loading…')}</p></div>;
  }

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.approve.intro', 'Approve only people you know are real. Your vouch counts toward their four.')}
      </p>
      <p className={pages.intro}>
        {t('verification.demoNote', 'Demo: these members reply automatically. No real person is contacted.')}
      </p>
      {pending.length === 0 ? (
        <EmptyState
          icon={<Inbox size={48} aria-hidden />}
          title={
            verified
              ? t('verification.approve.emptyVerified', 'No requests right now.')
              : t('verification.approve.emptyUnverified', "Members can ask you to vouch once you're verified.")
          }
          action={
            verified ? undefined : (
              <Button size="md" onClick={() => navigate('/identity/verification')}>
                {t('gate.getVerified', 'Get verified')}
              </Button>
            )
          }
        />
      ) : (
        <ul className={pages.list}>
          {pending.map((request) => {
            const member = byKey.get(request.requester);
            const when = formatTimeAgo(t, request.at);
            const isLeaving = leaving === request.id;
            return (
              <Card as="li" key={request.id} className={clsx(styles.card, isLeaving && styles.leaving)}>
                <MemberCard
                  name={member?.name ?? request.requester.slice(0, 8)}
                  countryCode={member?.country}
                  online={member?.online}
                  onlineLabel={t('verification.member.online', 'Online')}
                  offlineLabel={t('verification.member.offline', 'Offline')}
                  meta={when ? `${t('verification.approve.asked', 'asked you to vouch')} · ${when}` : t('verification.approve.asked', 'asked you to vouch')}
                />
                <div className={styles.actions}>
                  {isLeaving ? (
                    <span className={styles.done}>
                      <CheckCircle2 size={18} aria-hidden />
                      {t('verification.approve.approved', 'Approved')}
                    </span>
                  ) : (
                    <>
                      <Button size="md" onClick={() => void respond(request, true)} disabled={busy}>
                        {t('verification.approve.approve', 'Approve')}
                      </Button>
                      <Button size="md" variant="ghost" onClick={() => void respond(request, false)} disabled={busy}>
                        {t('verification.approve.decline', 'Decline')}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ApprovePage;
