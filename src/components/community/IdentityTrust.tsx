import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, QrCode, Share2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { Card, TrustBadge, Button, ProgressBar } from '../shared';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import { VERIFIED_THRESHOLD } from '../../services/trust';
import { useT } from '../../i18n';
import styles from './IdentityTrust.module.scss';

const IdentityCardDialog = lazy(() => import('./dialogs/IdentityCardDialog'));
const QRScannerDialog = lazy(() => import('./dialogs/QRScannerDialog'));
const Share = lazy(() => import('./Share'));

interface IdentityTrustProps {
  communityId: string;
}

const IdentityTrust: React.FC<IdentityTrustProps> = ({ communityId }) => {
  const { communityMembers, communityProperties } = useAppSelector((s) => s.communities);
  const { publicKey } = useAppSelector((s) => s.user);
  const t = useT();
  const navigate = useNavigate();
  const trust = useCommunityTrust(communityId);

  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const communityName = communityProperties[communityId]?.name || 'Community';

  // The section title + web-of-trust intro render in the AppHeader title block (S23).
  if (!isMember) {
    return (
      <div className={styles.container}>
        <p className={styles.stateMessage}>{t('identityTrust.nonMember', 'You must be a member of this community to access identity features.')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.verifyCard}>
        <div className={styles.verifyHeader}>
          <span className={styles.verifyTitle}>{t('trust.your.title', 'Your verification')}</span>
          <TrustBadge state={trust.currentUserTrust} vouchCount={trust.currentUserVouchCount} size="md" />
        </div>
        <ProgressBar
          value={Math.min(trust.currentUserVouchCount, VERIFIED_THRESHOLD)}
          max={VERIFIED_THRESHOLD}
          size="md"
          variant={trust.currentUserTrust === 'verified' ? 'success' : 'primary'}
          label={t('trust.your.barLabel', 'Verification progress')}
        />
        <p className={styles.verifyStatus}>
          {trust.currentUserTrust === 'verified'
            ? t('trust.your.verified', "You're verified — this counts in every community.")
            : t('trust.your.progress', 'Vouched by {count} of {threshold} needed to verify. Ask members you know to vouch for you.', {
                count: trust.currentUserVouchCount,
                threshold: VERIFIED_THRESHOLD,
              })}
        </p>
        {trust.currentUserTrust !== 'verified' && (
          <div className={styles.verifyActions}>
            {/* S36 — the platform-wide hub (D8) owns the request/invite flows. */}
            <Button size="sm" variant="secondary" onClick={() => navigate('/identity/verification')}>
              {t('gate.getVerified', 'Get verified')}
            </Button>
          </div>
        )}
      </Card>

      <div className={styles.trustSection}>
        <div className={styles.trustActions}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<IdCard size={18} />}
            onClick={() => setShowIdentityCard(true)}
          >
            {t('identityTrust.myIdCard', 'My ID Card')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<QrCode size={18} />}
            onClick={() => setShowQRScanner(true)}
          >
            {t('identityTrust.scanMember', 'Scan Member')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Share2 size={18} />}
            onClick={() => setShowShare((v) => !v)}
          >
            {t('common.share', 'Share')}
          </Button>
        </div>
        {showShare && (
          <div className={styles.shareEmbed}>
            <Suspense fallback={<p>{t('common.loading', 'Loading…')}</p>}>
              <Share communityId={communityId} />
            </Suspense>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <IdentityCardDialog
          isOpen={showIdentityCard}
          onClose={() => setShowIdentityCard(false)}
          communityName={communityName}
        />
        <QRScannerDialog
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          communityId={communityId}
        />
      </Suspense>
    </div>
  );
};

export default IdentityTrust;
