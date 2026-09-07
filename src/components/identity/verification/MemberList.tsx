import React from 'react';
import { MemberCard } from '../../shared';
import type { MemberSummary } from '../../../services/verification';
import { useT } from '../../../i18n';
import pages from './VerificationPages.module.scss';

export interface MemberListProps {
  members: MemberSummary[];
  /** Trailing slot per row — a <Button size="sm">, a <Badge>, or a checkbox control. */
  action: (member: MemberSummary) => React.ReactNode;
  loading?: boolean;
  /** Rendered when !loading and members is empty. Callers own the icon + copy. */
  empty: React.ReactNode;
  /** Extra props per row, e.g. selection styling in the picker. */
  rowClassName?: (member: MemberSummary) => string | undefined;
}

/**
 * Canonical `loading → empty → <ul><MemberCard></ul>` block for verification
 * member lists (S36 §8 duplication; extracted in S37 Task 1 so RequestPage,
 * InvitePage, and the VerifierPicker share one implementation). Owns the
 * online/offline presence labels — callers only own the empty state and the
 * per-row action slot. `trustState="verified"` is fixed: every member in
 * these lists is verified by definition.
 */
const MemberList: React.FC<MemberListProps> = ({ members, action, loading = false, empty, rowClassName }) => {
  const t = useT();

  if (loading) {
    return <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>;
  }

  if (members.length === 0) {
    return <>{empty}</>;
  }

  return (
    <ul className={pages.list}>
      {members.map((member) => (
        <MemberCard
          as="li"
          key={member.publicKey}
          name={member.name}
          countryCode={member.country}
          online={member.online}
          onlineLabel={t('verification.member.online', 'Online')}
          offlineLabel={t('verification.member.offline', 'Offline')}
          trustState="verified"
          action={action(member)}
          className={rowClassName?.(member)}
        />
      ))}
    </ul>
  );
};

export default MemberList;
