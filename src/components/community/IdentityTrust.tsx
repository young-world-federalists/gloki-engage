import React, { useState, Suspense, lazy } from 'react';
import { IdCard, QrCode, Share2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { Card, TrustBadge, Button } from '../shared';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import { useDigitalAgent } from '../identity/agent/useDigitalAgent';
import { VERIFIED_THRESHOLD, addUserVouch } from '../../services/trust';
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
  const trust = useCommunityTrust(communityId);
  const { agent } = useDigitalAgent();

  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const communityName = communityProperties[communityId]?.name || 'Community';

  // Demo affordance: "meet" a community member who hasn't vouched yet, adding
  // their vouch so a pending user can cross 2 -> 4 and watch the Verified-gated
  // stages unlock live (the QR camera isn't exercisable in the preview).
  const handleMeetMember = () => {
    const alreadyVouched = new Set(agent?.vouchedBy ?? []);
    const candidate = allMembers.find((pk) => pk !== publicKey && !alreadyVouched.has(pk));
    if (candidate) addUserVouch(candidate);
  };

  if (!isMember) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h2>{t('identityTrust.title', 'Identity & Trust')}</h2>
          <p>{t('identityTrust.nonMember', 'You must be a member of this community to access identity features.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2>{t('identityTrust.title', 'Identity & Trust')}</h2>
        <p>
          {t(
            'identityTrust.intro',
            "Gloki uses a web of trust to verify community members. By scanning each other's QR codes and confirming real-world identity, you strengthen the trust network within your community. The more verified connections you have, the stronger your community's democratic foundation.",
          )}
        </p>
      </div>

      <Card className={styles.verifyCard}>
        <div className={styles.verifyHeader}>
          <span className={styles.verifyTitle}>{t('trust.your.title', 'Your verification')}</span>
          <TrustBadge state={trust.currentUserTrust} vouchCount={trust.currentUserVouchCount} size="md" />
        </div>
        <div
          className={styles.verifyBar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={VERIFIED_THRESHOLD}
          aria-valuenow={Math.min(trust.currentUserVouchCount, VERIFIED_THRESHOLD)}
        >
          <div
            className={`${styles.verifyFill} ${trust.currentUserTrust === 'verified' ? styles.verifyFillDone : ''}`}
            style={{ width: `${Math.min(100, (trust.currentUserVouchCount / VERIFIED_THRESHOLD) * 100)}%` }}
          />
        </div>
        <p className={styles.verifyStatus}>
          {trust.currentUserTrust === 'verified'
            ? t('trust.your.verified', "You're a verified member of this community.")
            : t('trust.your.progress', 'Vouched by {count} of {threshold} needed to verify. Meet more members to build trust.', {
                count: trust.currentUserVouchCount,
                threshold: VERIFIED_THRESHOLD,
              })}
        </p>
        {trust.currentUserTrust !== 'verified' && (
          <div className={styles.verifyActions}>
            <Button size="sm" variant="secondary" onClick={handleMeetMember}>
              {t('trust.meetMember', 'Meet a member (demo)')}
            </Button>
          </div>
        )}
      </Card>

      <div className={styles.trustSection}>
        <div className={styles.trustActions}>
          <button className={styles.trustBtn} onClick={() => setShowIdentityCard(true)}>
            <IdCard size={18} />
            <span>{t('identityTrust.myIdCard', 'My ID Card')}</span>
          </button>
          <button className={styles.trustBtn} onClick={() => setShowQRScanner(true)}>
            <QrCode size={18} />
            <span>{t('identityTrust.scanMember', 'Scan Member')}</span>
          </button>
          <button className={styles.trustBtn} onClick={() => setShowShare((v) => !v)}>
            <Share2 size={18} />
            <span>{t('common.share', 'Share')}</span>
          </button>
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
