import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EmptyState, MemberCard } from '../../shared';
import { useT } from '../../../i18n';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import type { Approval, MemberSummary } from '../../../services/verification';
import pages from './VerificationPages.module.scss';

interface Props {
  approvals: Approval[];
  /** All 30 members, for names + flags; unknown keys (a real QR scan) fall back to the key prefix. */
  byKey: Map<string, MemberSummary>;
  loading: boolean;
}

/** Who vouched for the user, how, and when (spec §3.3 "ApprovalHistory"). */
const ApprovalHistory: React.FC<Props> = ({ approvals, byKey, loading }) => {
  const t = useT();
  const methodLabel = (method: Approval['method']): string =>
    method === 'invitation'
      ? t('verification.method.invitation', 'Invited you')
      : t('verification.method.direct', 'Vouched for you');

  return (
    <section aria-labelledby="verification-history-title">
      <h2 id="verification-history-title" className={pages.sectionTitle}>
        {t('verification.history.title', 'Your approvals')}
      </h2>
      {loading ? (
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      ) : approvals.length === 0 ? (
        <EmptyState
          compact
          icon={<ShieldCheck size={48} />}
          title={t('verification.history.empty', 'No approvals yet. Ask a member to vouch for you.')}
        />
      ) : (
        <ul className={pages.list}>
          {approvals.map((a) => {
            const member = byKey.get(a.approver);
            const when = formatTimeAgo(t, a.at);
            return (
              <MemberCard
                as="li"
                key={a.id}
                name={member?.name ?? a.approver.slice(0, 8)}
                countryCode={member?.country}
                online={member?.online}
                onlineLabel={t('verification.member.online', 'Online')}
                offlineLabel={t('verification.member.offline', 'Offline')}
                trustState="verified"
                meta={when ? `${methodLabel(a.method)} · ${when}` : methodLabel(a.method)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ApprovalHistory;
