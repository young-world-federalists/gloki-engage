import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { IProfile } from '../../services/interfaces';
import ApprovalDialog from './dialogs/ApprovalDialog';
import MessageDialog from './dialogs/MessageDialog';
import styles from './Members.module.scss';
import { requestJoin } from '../../services/contracts/community';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import { UserIdentity, Button } from '../shared';
import { SmartImage } from '../shared/connectivity';
import { displayNameFor } from '../../utils/displayName';
import type { TrustState } from '../../services/trustModel';
import { eventStreamService } from '../../services/eventStream';
import type { BlockchainEvent } from '../../services/eventStream';
import { useT } from '../../i18n';

interface MemberItemProps {
  publicKey: string;
  profile: IProfile | null;
  showApproveButton?: boolean;
  isApproved?: boolean;
  onApprove?: () => void;
  trustState?: TrustState;
  vouchCount?: number;
}

const MemberItem: React.FC<MemberItemProps> = ({
  publicKey,
  profile,
  showApproveButton = false,
  isApproved = false,
  onApprove,
  trustState,
}) => {
  const t = useT();
  const fullName = displayNameFor(profile);
  const displayName = fullName || t('members.unknown', 'Unknown Member');
  const profileImage = profile?.userPhoto;

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberAvatar}>
        {profileImage ? (
          <SmartImage
            src={profileImage}
            alt={displayName}
            fallbackLabel={displayName}
            size={56}
            rounded
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.defaultAvatar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
      </div>
      <div className={styles.memberInfo}>
        <div className={styles.nameRow}>
          <UserIdentity
            name={displayName}
            countryCode={profile?.country}
            trustState={trustState}
            size="sm"
          />
          {showApproveButton && (
            isApproved ? (
              <Button variant="primary" size="sm" disabled>
                {t('members.approved', 'Approved')}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onApprove}>
                {t('members.approve', 'Approve')}
              </Button>
            )
          )}
        </div>
        <div className={styles.publicKey}>{publicKey}</div>
      </div>
    </div>
  );
};

interface MembersProps {
  communityId: string;
}

const Members: React.FC<MembersProps> = ({ communityId }) => {
  const t = useT();
  const { communityMembers, communityTasks, communityNominates, profiles } = useAppSelector((state) => state.communities);
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);
  const trust = useCommunityTrust(communityId);
  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const tasks: Record<string, boolean> = communityTasks[communityId] || {};
  const taskAgents: string[] = Object.keys(tasks);
  const nominates: string[] = Array.isArray(communityNominates[communityId]) ? communityNominates[communityId] : [];
  const [isJoining, setIsJoining] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: ''
  });

  const members: string[] = allMembers.filter(member => !taskAgents.includes(member));

  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    agentPublicKey: string;
    agentName: string;
    agentProfileImage?: string;
  }>({
    isOpen: false,
    agentPublicKey: '',
    agentName: '',
    agentProfileImage: undefined
  });

  const handleApproveClick = (agentId: string) => {
    const profile = profiles[agentId];
    const fullName = displayNameFor(profile);
    const displayName = fullName || t('members.unknown', 'Unknown Member');
    const profileImage = profile?.userPhoto;

    setApprovalDialog({
      isOpen: true,
      agentPublicKey: agentId,
      agentName: displayName,
      agentProfileImage: profileImage
    });
  };

  const handleCloseDialog = () => {
    setApprovalDialog({
      isOpen: false,
      agentPublicKey: '',
      agentName: '',
      agentProfileImage: undefined
    });
  };

  const allPeople = [
    ...taskAgents.map(agentId => ({
      publicKey: agentId,
      profile: profiles[agentId],
      showApproveButton: true,
      isApproved: tasks[agentId],
      onApprove: () => handleApproveClick(agentId),
      trustState: trust.trustOf(agentId),
      vouchCount: trust.vouchCountOf(agentId)
    })),
    ...members.map(pk => ({
      publicKey: pk,
      profile: profiles[pk],
      showApproveButton: false,
      isApproved: false,
      onApprove: undefined,
      trustState: trust.trustOf(pk),
      vouchCount: trust.vouchCountOf(pk)
    }))
  ];

  const currentUserInList = publicKey && (
    allMembers.includes(publicKey) ||
    nominates.includes(publicKey)
  );

  const joinRequestResponseRef = useRef<any>(null);
  const contractWriteListenerRef = useRef<((event: BlockchainEvent) => void) | null>(null);

  const cleanupJoinListener = useCallback(() => {
    if (contractWriteListenerRef.current) {
      eventStreamService.removeEventListener('contract_write', contractWriteListenerRef.current);
      contractWriteListenerRef.current = null;
    }
    joinRequestResponseRef.current = null;
    setIsJoining(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupJoinListener();
    };
  }, [cleanupJoinListener]);

  const handleJoinCommunity = async () => {
    if (!serverUrl || !publicKey || !communityId) return;

    setIsJoining(true);

    const handleContractWrite = (event: BlockchainEvent) => {
      if (event.contract === communityId && joinRequestResponseRef.current) {
        if (event.request === joinRequestResponseRef.current) {
          if (event.reply === false) {
            setMessageDialog({
              isOpen: true,
              message: t('members.tooManyNominates', 'There are currently too many nominates in the community. Please try again later.')
            });
          }
          cleanupJoinListener();
        }
      }
    };

    contractWriteListenerRef.current = handleContractWrite;
    eventStreamService.addEventListener('contract_write', handleContractWrite);

    try {
      const response = await requestJoin(serverUrl, publicKey, communityId);
      joinRequestResponseRef.current = response;
    } catch (error) {
      console.error('Failed to join community:', error);
      setMessageDialog({
        isOpen: true,
        message: t('members.joinFailed', 'Failed to join community. Please try again.'),
      });
      cleanupJoinListener();
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('members.title', 'Members')}</h2>
          <p>{t('members.intro', 'People in this community. Members can propose initiatives, vote on decisions, and participate in governance.')}</p>
          <p className={styles.memberCount}>{allMembers.length === 1
            ? t('members.count.one', '1 community member')
            : t('members.count.many', '{n} community members', { n: allMembers.length })}</p>
        </div>

        {!currentUserInList && publicKey && (
          <div className={styles.joinSection}>
            <Button variant="primary" loading={isJoining} onClick={handleJoinCommunity}>
              {t('members.join', 'Join Community')}
            </Button>
          </div>
        )}

        <div className={styles.list}>
          {allPeople.length === 0 ? (
            <div className="empty-state">
              <p>{t('members.empty', 'No members found.')}</p>
            </div>
          ) : (
            allPeople.map((person) => (
              <MemberItem
                key={person.publicKey}
                publicKey={person.publicKey}
                profile={person.profile}
                showApproveButton={person.showApproveButton}
                isApproved={person.isApproved}
                onApprove={person.onApprove}
                trustState={person.trustState}
                vouchCount={person.vouchCount}
              />
            ))
          )}
        </div>
      </div>

      <ApprovalDialog
        isOpen={approvalDialog.isOpen}
        onClose={handleCloseDialog}
        agentPublicKey={approvalDialog.agentPublicKey}
        agentName={approvalDialog.agentName}
        agentProfileImage={approvalDialog.agentProfileImage}
        communityId={communityId}
      />

      <MessageDialog
        isOpen={messageDialog.isOpen}
        message={messageDialog.message}
        onClose={() => setMessageDialog({ isOpen: false, message: '' })}
      />
    </>
  );
};

export default Members;
