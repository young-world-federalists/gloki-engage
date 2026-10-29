import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { decodeCommunityInvitation } from '../../../services/encodeDecode';
import { useAppSelector } from '../../../store/hooks';
import { addUserVouch } from '../../../services/trust';
import { displayNameFor } from '../../../utils/displayName';
import { useT } from '../../../i18n';
import { Button, Modal } from '../../shared';
import styles from './QRScannerDialog.module.scss';

interface QRScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
}

interface ScanResult {
  isValid: boolean;
  isMember: boolean;
  agent: string;
  server: string;
  contract: string;
  memberProfile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    userPhoto?: string;
  };
}

const QRScannerDialog: React.FC<QRScannerDialogProps> = ({
  isOpen,
  onClose,
  communityId
}) => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const t = useT();

  const { communityMembers, profiles } = useAppSelector(state => state.communities);
  const { contracts } = useAppSelector(state => state.user);
  const handleScanResult = async (codes: { rawValue: string }[]) => {
    if (codes && codes.length > 0 && codes[0].rawValue) {
      const qrData = codes[0].rawValue;
      setIsValidating(true);
      setScanResult(null);

      try {
        // Decode the QR code
        const decoded = decodeCommunityInvitation(qrData);

        if (!decoded) {
          setScanResult({
            isValid: false,
            isMember: false,
            agent: '',
            server: '',
            contract: ''
          });
          setIsValidating(false);
          return;
        }

        const { server, agent, contract } = decoded;

        // Check if the contract matches the current community
        const currentCommunityContract = contracts.find(c => c.id === communityId);
        const contractMatches = currentCommunityContract?.id === contract;

        // Check if the agent is a member of this community
        const communityMembersList = communityMembers[communityId] || [];
        const isMember = communityMembersList.includes(agent);
        const isAuthenticatedMember = isMember && contractMatches;

        // A confirmed scan of a real community member strengthens the web of
        // trust — record their vouch (addUserVouch dedups, so re-scanning the
        // same member is a no-op).
        if (isAuthenticatedMember) {
          addUserVouch(agent);
        }

        // Get member profile if available
        const memberProfile = profiles[agent];

        setScanResult({
          isValid: true,
          isMember: isAuthenticatedMember,
          agent,
          server,
          contract,
          memberProfile: memberProfile ? {
            firstName: memberProfile.firstName,
            lastName: memberProfile.lastName,
            displayName: memberProfile.displayName,
            userPhoto: memberProfile.userPhoto
          } : undefined
        });

      } catch (error) {
        console.error('Error processing QR code:', error);
        setScanResult({
          isValid: false,
          isMember: false,
          agent: '',
          server: '',
          contract: ''
        });
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleError = (error: unknown) => {
    console.error('QR Scanner error:', error);
  };

  // displayNameFor prefers the opt-in displayName pseudonym, then first+last —
  // real profiles only ever set displayName, so the old firstName+lastName-only
  // check never matched them and always fell through to "Unknown Member".
  const memberName = displayNameFor(scanResult?.memberProfile) || t('members.unknown', 'Unknown Member');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('identityTrust.scanTitle', 'Scan Identity Card')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          {scanResult && (
            <Button variant="secondary" onClick={() => setScanResult(null)}>
              {t('identityTrust.scanAgain', 'Scan Again')}
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </>
      }
    >
      {!scanResult && !isValidating && (
        <div className={styles.scannerContainer}>
          <Scanner
            onScan={handleScanResult}
            onError={handleError}
            // Third-party style object — camera letterbox black; radius maps
            // to the $radius-md token (8px).
            styles={{
              container: {
                width: '100%',
                height: '400px',
                background: '#000',
                borderRadius: '8px'
              }
            }}
          />
        </div>
      )}

      {isValidating && (
        <div className={styles.validating}>
          <div className={styles.spinner}></div>
          <p>{t('identityTrust.scanValidating', 'Validating identity card…')}</p>
        </div>
      )}

      {scanResult && (
        <div className={styles.result}>
          {scanResult.isValid && scanResult.isMember ? (
            <div className={styles.successResult}>
              <CheckCircle size={48} className={styles.successIcon} aria-hidden="true" />
              <h3>{t('identityTrust.scanAuthenticated', 'Authenticated Member')}</h3>
              <div className={styles.memberInfo}>
                {scanResult.memberProfile?.userPhoto && (
                  <img
                    src={scanResult.memberProfile.userPhoto}
                    alt={memberName}
                    className={styles.memberPhoto}
                  />
                )}
                <div className={styles.memberDetails}>
                  <h4>{memberName}</h4>
                  <p className={styles.agentKey}>
                    {t('identityTrust.scanAgent', 'Agent: {key}', { key: scanResult.agent })}
                  </p>
                </div>
              </div>
              <p className={styles.vouchConfirm}>
                {t('trust.vouchAdded', 'Vouch added — you’re now vouched by more members.')}
              </p>
            </div>
          ) : (
            <div className={styles.errorResult}>
              <XCircle size={48} className={styles.errorIcon} aria-hidden="true" />
              <h3>{t('identityTrust.scanInvalid', 'Invalid Identity')}</h3>
              <p>
                {!scanResult.isValid
                  ? t('identityTrust.scanInvalidFormat', 'Invalid QR code format')
                  : t('identityTrust.scanNotMember', 'This agent is not a member of this community')
                }
              </p>
              {scanResult.isValid && (
                <div className={styles.details}>
                  <p>{t('identityTrust.scanAgent', 'Agent: {key}', { key: scanResult.agent })}</p>
                  <p>{t('identityTrust.scanContract', 'Contract: {id}', { id: scanResult.contract })}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.instructions}>
        <p>
          {t(
            'identityTrust.scanInstructions',
            'Point your camera at a printed identity card QR code to verify membership.',
          )}
        </p>
      </div>
    </Modal>
  );
};

export default QRScannerDialog;
