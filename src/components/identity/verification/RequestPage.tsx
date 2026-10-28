import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Button, Badge, EmptyState, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { requestVouch, type MemberSummary } from '../../../services/verification';
import MemberList from './MemberList';
import pages from './VerificationPages.module.scss';

/**
 * /identity/verification/request — pick verified people and ask them to
 * vouch. The request is recorded on the verification contract and stays
 * "Requested ✓" until the person answers; their vouch then shows here and in
 * the hub (both re-read the contract).
 */
const RequestPage: React.FC = () => {
  const t = useT();
  const toast = useToast();
  const { ctx, state, refetch } = useVerification();
  const { members, query, setQuery, loading } = useVerifiedMembers();
  const [inFlight, setInFlight] = useState<Set<string>>(() => new Set());

  const vouchedBy = new Set((state?.approvals ?? []).map((a) => a.approver));
  const sentTo = new Map((state?.sent ?? []).map((r) => [r.approver, r.status]));

  const handleRequest = async (member: MemberSummary) => {
    if (!ctx) return;
    setInFlight((prev) => new Set(prev).add(member.publicKey));
    try {
      await requestVouch(ctx, member.publicKey);
      toast.show({ tone: 'success', message: t('verification.request.sentToast', 'Request sent to {name}', { name: member.name }) });
    } catch (err) {
      toast.show({ tone: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      await refetch();
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
    return <Button size="sm" onClick={() => void handleRequest(member)}>{t('verification.request.cta', 'Request')}</Button>;
  };

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.request.intro', 'Members you know can confirm you\'re a real person. Each approval counts toward your four.')}
      </p>
      <div className={pages.field}>
        <label htmlFor="verification-search" className={pages.fieldLabel}>
          {t('verification.request.search', 'Search by name')}
        </label>
        <input
          id="verification-search"
          type="search"
          className={pages.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('verification.request.searchPlaceholder', 'Name')}
          autoComplete="off"
        />
      </div>
      <MemberList
        members={members}
        loading={loading}
        action={actionFor}
        showPresence={false}
        empty={<EmptyState compact icon={query ? <Search size={48} aria-hidden /> : <Users size={48} aria-hidden />} title={t('verification.request.empty', 'No members match.')} />}
      />
    </div>
  );
};

export default RequestPage;
