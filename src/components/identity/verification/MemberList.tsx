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
  /**
   * Accessible labels for the presence dot. Default to the generic
   * "Online"/"Offline" strings — override when a caller repurposes
   * `MemberSummary.online` for a different boolean (e.g. WaitingRoom's
   * "joined this call" state) so the dot's label agrees with whatever the
   * row's own action slot (e.g. a Badge) says about that same state.
   */
  onlineLabel?: string;
  offlineLabel?: string;
}

/**
 * Canonical `loading → empty → <ul><MemberCard></ul>` block for verification
 * member lists (S36 §8 duplication; extracted in S37 Task 1 so RequestPage,
 * InvitePage, and the VerifierPicker share one implementation). Owns the
 * online/offline presence labels — callers only own the empty state and the
 * per-row action slot. `trustState="verified"` is fixed: every member in
 * these lists is verified by definition.
 */
const MemberList: React.FC<MemberListProps> = ({
  members,
  action,
  loading = false,
  empty,
  rowClassName,
  onlineLabel,
  offlineLabel,
}) => {
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
          onlineLabel={onlineLabel ?? t('verification.member.online', 'Online')}
          offlineLabel={offlineLabel ?? t('verification.member.offline', 'Offline')}
          trustState="verified"
          action={action(member)}
          className={rowClassName?.(member)}
        />
      ))}
    </ul>
  );
};

export default MemberList;
