import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Button, EmptyState, MemberCard, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { requestInvitation, sendInvitation, type MemberSummary } from '../../../services/verification';
import pages from './VerificationPages.module.scss';

/**
 * /identity/verification/invite — branches on trust (spec §3.3):
 * verified → invite someone by name + email, with a vouch checkbox;
 * unverified → ask a verified member for an invitation.
 * The demo records both locally and sends no email — the copy says so.
 */
const InvitePage: React.FC = () => {
  const t = useT();
  const toast = useToast();
  const { ctx, state, refetch, trust } = useVerification();
  const { members, loading } = useVerifiedMembers();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vouch, setVouch] = useState(true);
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const requested = new Set(state?.invitationRequests ?? []);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ctx || !e.currentTarget.checkValidity()) return;
    const who = name.trim();
    setSending(true);
    try {
      await sendInvitation(ctx, { name: who, email: email.trim(), vouch });
      await refetch(); // demo seam emits no write events
    } finally {
      setSending(false);
    }
    toast.show({
      tone: 'success',
      message: t('verification.invite.sentToast', 'Invitation recorded for {name} — this demo sends no email.', { name: who }),
    });
    setName('');
    setEmail('');
  };

  const handleRequest = async (member: MemberSummary) => {
    if (!ctx) return;
    setRequesting(member.publicKey);
    try {
      await requestInvitation(ctx, member.publicKey);
      await refetch();
    } finally {
      setRequesting(null);
    }
    toast.show({ tone: 'success', message: t('verification.invite.requestedToast', 'Invitation request sent to {name}', { name: member.name }) });
  };

  if (trust === 'verified') {
    return (
      <form className={pages.page} onSubmit={(e) => void handleSend(e)}>
        <p className={pages.intro}>
          {t('verification.invite.formIntro', 'Invite someone you know. Ticking the box counts as your vouch for them.')}
        </p>
        <div className={pages.field}>
          <label htmlFor="invite-name" className={pages.fieldLabel}>{t('verification.invite.name', 'Their name')}</label>
          <input id="invite-name" className={pages.input} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
        </div>
        <div className={pages.field}>
          <label htmlFor="invite-email" className={pages.fieldLabel}>{t('verification.invite.email', 'Their email')}</label>
          <input id="invite-email" type="email" className={pages.input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
        </div>
        <label className={pages.checkboxRow}>
          <input type="checkbox" checked={vouch} onChange={(e) => setVouch(e.target.checked)} />
          {t('verification.invite.vouch', 'I know this person and vouch for them')}
        </label>
        <div className={pages.actions}>
          <Button type="submit" fullWidth loading={sending} disabled={!name.trim() || !email.trim()}>
            {t('verification.invite.send', 'Send invitation')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.invite.requestIntro', 'Verified members can invite you. Ask someone who knows you.')}
      </p>
      {loading ? (
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      ) : members.length === 0 ? (
        <EmptyState compact icon={<Users size={48} aria-hidden />} title={t('verification.invite.empty', 'No verified members yet.')} />
      ) : (
        <ul className={pages.list}>
          {members.map((m) => (
            <MemberCard
              as="li"
              key={m.publicKey}
              name={m.name}
              countryCode={m.country}
              online={m.online}
              onlineLabel={t('verification.member.online', 'Online')}
              offlineLabel={t('verification.member.offline', 'Offline')}
              trustState="verified"
              action={
                requested.has(m.publicKey) || requesting === m.publicKey ? (
                  <Button size="sm" variant="secondary" disabled>{t('verification.invite.requested', 'Requested ✓')}</Button>
                ) : (
                  <Button size="sm" onClick={() => void handleRequest(m)}>{t('verification.invite.requestCta', 'Request invitation')}</Button>
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default InvitePage;
