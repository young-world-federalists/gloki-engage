import React, { useState } from 'react';
import { Download } from 'lucide-react';
import styles from './IdentityCardDialog.module.scss';
import { useAppSelector } from '../../../store/hooks';
import { displayNameFor } from '../../../utils/displayName';
import { encodeCommunityInvitation } from '../../../services/encodeDecode';
import IdentityCardSVG from './IdentityCardSVG';
import { generateIdentityCardPDF } from './IdentityCardPDFGenerator';
import { useT } from '../../../i18n';
import { useAlert } from '../../shared/useAlert';
import { Button, Modal } from '../../shared';

interface IdentityCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
}

const IdentityCardDialog: React.FC<IdentityCardDialogProps> = ({
  isOpen,
  onClose,
  communityName
}) => {
  const { contracts, publicKey } = useAppSelector(state => state.user);
  const { profiles } = useAppSelector(state => state.communities);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const t = useT();
  const { showAlert, alertElement } = useAlert();

  // Get community contract info
  const communityContract = contracts.find((c) => c.name === communityName);
  const server = communityContract?.address || '';
  const agent = publicKey || '';
  const contract = communityContract?.id || '';

  // Get user profile
  const userProfile = profiles[publicKey || ''] || {};

  const qrData = encodeCommunityInvitation(server, agent, contract);

  // The credential's name + fallbacks are kept in canonical English to stay coherent
  // with the English IdentityCardSVG credential (see that file's header note).
  // displayNameFor prefers the opt-in displayName pseudonym, then first+last —
  // real profiles only ever set displayName, so the old firstName+lastName-only
  // check never matched them and always fell through to "Unknown Member".
  const resolvedMemberName = displayNameFor(userProfile);
  const memberName = resolvedMemberName || 'Unknown Member';
  const memberInitial = resolvedMemberName ? resolvedMemberName.charAt(0).toUpperCase() : '?';

  const handleDownloadCard = async () => {
    try {
      setIsGeneratingPDF(true);

      // Generate PDF directly from SVG using svg2pdf
      const pdfBlob = await generateIdentityCardPDF({
        communityName,
        memberName,
        memberInitial,
        memberPhoto: userProfile.userPhoto,
        agentId: agent || 'Unknown',
        qrData,
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `identity-card-${communityName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlert(
        t('identityCard.pdfError', "Couldn't generate the PDF: {error}", {
          error: error instanceof Error ? error.message : String(error),
        }),
        { title: t('common.errorTitle', 'Something went wrong') },
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('identityCard.title', 'Identity Card')}
        closeLabel={t('common.close', 'Close')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Download size={18} />}
              loading={isGeneratingPDF}
              onClick={handleDownloadCard}
            >
              {isGeneratingPDF
                ? t('identityCard.generating', 'Generating…')
                : t('identityCard.download', 'Download Card')}
            </Button>
          </>
        }
      >
        <div className={styles.cardContainer}>
          <div className={styles.cardScaler}>
            <IdentityCardSVG
              communityName={communityName}
              memberName={memberName}
              memberInitial={memberInitial}
              memberPhoto={userProfile.userPhoto}
              agentId={agent || 'Unknown'}
              qrData={qrData}
              width={428}
              height={270}
            />
          </div>
        </div>
      </Modal>
      {alertElement}
    </>
  );
};

export default IdentityCardDialog;
