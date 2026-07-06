import React, { useState } from 'react';
import { approveAgent, disapproveAgent } from '../../../services/contracts/community';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Banner, Button, Modal } from '../../shared';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (action: typeof approveAgent) => {
    if (!publicKey || !serverUrl || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await action(serverUrl, publicKey, communityId, agentPublicKey);
      onClose();
    } catch (err) {
      console.error('Failed to record the approval decision:', err);
      setError(t('members.approveFailed', "Couldn't save your decision. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => decide(approveAgent);
  const handleDisapprove = () => decide(disapproveAgent);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={t('members.approveTitle', 'Confirm identity')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="destructive" onClick={handleDisapprove} loading={isSubmitting}>
            {t('members.disapprove', 'Disapprove')}
          </Button>
          <Button variant="primary" onClick={handleApprove} loading={isSubmitting}>
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

      {error && <Banner tone="error">{error}</Banner>}
    </Modal>
  );
};

export default ApprovalDialog;
