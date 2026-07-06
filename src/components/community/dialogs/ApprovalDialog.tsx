import React from 'react';
import { approveAgent, disapproveAgent } from '../../../services/contracts/community';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Button, Modal } from '../../shared';
import styles from './ApprovalDialog.module.scss';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentPublicKey: string;
  agentName: string;
  agentProfileImage?: string;
  communityId: string;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  onClose,
  agentPublicKey,
  agentName,
  agentProfileImage,
  communityId
}) => {
  const t = useT();
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);

  const handleApprove = async () => {
    if (!publicKey || !serverUrl) return;

    try {
      await approveAgent(
        serverUrl,
        publicKey,
        communityId,
        agentPublicKey,
      );
      onClose();
    } catch (error) {
      console.error('Failed to approve agent:', error);
    }
  };

  const handleDisapprove = async () => {
    if (!publicKey || !serverUrl) return;

    try {
      await disapproveAgent(
        serverUrl,
        publicKey,
        communityId,
        agentPublicKey
      );
      onClose();
    } catch (error) {
      console.error('Failed to disapprove agent:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={t('members.approveTitle', 'Confirm identity')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="destructive" onClick={handleDisapprove}>
            {t('members.disapprove', 'Disapprove')}
          </Button>
          <Button variant="primary" onClick={handleApprove}>
            {t('members.approve', 'Approve')}
          </Button>
        </>
      }
    >
      <div className={styles.profileSection}>
        <div className={styles.profileImage}>
          {agentProfileImage ? (
            <img src={agentProfileImage} alt={agentName} />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span>?</span>
            </div>
          )}
        </div>
      </div>

      <p className={styles.message}>
        {t(
          'members.approveBody',
          'Do you confirm that the person with the public key below is named {name} and looks like this?',
          { name: agentName },
        )}
      </p>
      <p className={styles.publicKey}>{agentPublicKey}</p>
    </Modal>
  );
};

export default ApprovalDialog;
